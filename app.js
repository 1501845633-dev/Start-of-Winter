/* 核心便签动画整理自用户提供页面；已移除平台注入与嵌套依赖。 */
'use strict';
const config = window.CONFIG;
const board = document.getElementById('board');
const messages = [...new Set(config.messages.filter(text => typeof text === 'string' && text.trim()))];
if (!messages.length) messages.push('愿你今天有个好心情');
const messageQueue = [...messages];
for (let i = messageQueue.length - 1; i > 0; i--) {
	const j = Math.floor(Math.random() * (i + 1));
	[messageQueue[i], messageQueue[j]] = [messageQueue[j], messageQueue[i]];
}
const tipTitle = config.cardTitle;
let started = false;
document.title = config.pageTitle;
document.getElementById('intro-title').textContent = config.pageTitle;
document.getElementById('intro-message').textContent = config.introMessage;
document.getElementById('start').textContent = config.startButton;
document.documentElement.style.setProperty('--accent', config.accentColor);
document.documentElement.style.setProperty('--background-opacity', Math.min(1, Math.max(0, Number(config.backgroundOpacity))));
if (config.backgroundImage) {
    const bg = document.getElementById('bgLayer');
    bg.style.backgroundImage = `url(${JSON.stringify(config.backgroundImage)})`;
}
const audio = document.getElementById('music');
const musicButton = document.getElementById('music-toggle');
if (config.music) { audio.src = config.music; musicButton.hidden = false; }
async function playMusic() {
    try { await audio.play(); musicButton.textContent = '暂停音乐'; }
    catch { musicButton.textContent = '点击播放音乐'; }
}
musicButton.addEventListener('click', () => {
    if (audio.paused) playMusic();
    else { audio.pause(); musicButton.textContent = '播放音乐'; }
});
document.getElementById('start').addEventListener('click', () => {
    if (started) return;
    started = true;
    document.getElementById('intro').hidden = true;
    createCard();
    for (let i = 1; i < initialCardCount; i++) setTimeout(createCard, i * spawnInterval);
    // 开场序列完成后再开始连续生成，避免两组定时器叠加。
    setTimeout(scheduleNextSpawn, Math.max(0, initialCardCount - 1) * spawnInterval);
    if (config.music) playMusic();
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && activeMaximizedCard) toggleMaximize(activeMaximizedCard);
});

const colors = config.colors.length ? config.colors : ["#e5d7ff"]

const cardStates = new WeakMap()
// Reserve a very high层级给全屏卡片，避免被后续元素覆盖
const MAXIMIZED_LAYER = 1000000
let activeMaximizedCard = null
const pointerMediaQuery = window.matchMedia('(pointer: coarse)')
let isMobile =
	pointerMediaQuery.matches || window.innerWidth <= 768
let maxCards = Math.max(1, Number(config.maxCards) || 100) // 限制 DOM 节点数量，减轻移动端压力
const initialCardCount = Math.max(0, Number(config.initialCardCount) || 0)
let spawnInterval = Math.max(100, Number(config.spawnInterval) || 700)
let zIndexCursor = 200
let spawnTimer = null

document.body.classList.toggle('is-mobile', isMobile)

function randomFrom(array) {
	return array[Math.floor(Math.random() * array.length)]
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max)
}


function applyTransform(card, state) {
	const scale = state.scale ?? 1
	const angle = state.angle ?? 0
	card.style.transform = `scale(${scale}) rotate(${angle}deg)`
}

function bringToFront(card) {
	if (card === activeMaximizedCard) {
		card.style.zIndex = MAXIMIZED_LAYER
		return
	}

	zIndexCursor += 1
	if (activeMaximizedCard && zIndexCursor >= MAXIMIZED_LAYER) {
		zIndexCursor = MAXIMIZED_LAYER - 1
	}

	card.style.zIndex = zIndexCursor
}

function updateBodyMaximizedState() {
	document.body.classList.toggle(
		'has-maximized-card',
		Boolean(activeMaximizedCard)
	)
}

function scheduleNextSpawn() {
	clearTimeout(spawnTimer)
	if (!started || messageQueue.length === 0) return

	spawnTimer = setTimeout(() => {
		if (document.hidden) return
		createCard()
		scheduleNextSpawn()
	}, spawnInterval)
}

function syncMobileMode() {
	const nextIsMobile =
		pointerMediaQuery.matches || window.innerWidth <= 768
	if (nextIsMobile === isMobile) return

	isMobile = nextIsMobile
	maxCards = Math.max(1, Number(config.maxCards) || 100)
	spawnInterval = Math.max(100, Number(config.spawnInterval) || 700)
	document.body.classList.toggle('is-mobile', isMobile)
	if (started) scheduleNextSpawn()
}

function handleBoardClick(event) {
	const control = event.target.closest('.control')
	if (!control) return

	const card = control.closest('.card')
	if (!card || !board.contains(card)) return

	event.preventDefault()

	if (control.classList.contains('close')) {
		closeCard(card)
	} else if (control.classList.contains('minimize')) {
		minimizeCard(card)
	} else if (control.classList.contains('maximize')) {
		toggleMaximize(card)
	}
}

function handleBoardPointerDown(event) {
	const card = event.target.closest('.card')
	if (!card || !board.contains(card)) return

	const control = event.target.closest('.control')
	const header = event.target.closest('.card-header')
	const pointerType = event.pointerType || 'mouse'
	const isPrimaryPointer = event.isPrimary !== false

	if (
		header &&
		!control &&
		pointerType !== 'touch' &&
		isPrimaryPointer
	) {
		startDrag(event, card)
		return
	}

	bringToFront(card)
}

function handleBoardDoubleClick(event) {
	const header = event.target.closest('.card-header')
	if (!header || event.target.closest('.control')) return

	const card = header.closest('.card')
	if (!card || !board.contains(card)) return

	toggleMaximize(card)
}

board.addEventListener('click', handleBoardClick)
board.addEventListener('pointerdown', handleBoardPointerDown)
board.addEventListener('dblclick', handleBoardDoubleClick)

function closeCard(card) {
	const state = cardStates.get(card)
	if (!state || state.closing) return
	if (card === activeMaximizedCard) {
		activeMaximizedCard = null
		updateBodyMaximizedState()
	}
	state.closing = true
	state.scale = 0.1
	card.style.opacity = '0'
	applyTransform(card, state)

	const handleTransitionEnd = event => {
		if (event.propertyName === 'opacity') {
			card.removeEventListener('transitionend', handleTransitionEnd)
			card.remove()
		}
	}

	card.addEventListener('transitionend', handleTransitionEnd)
	setTimeout(() => card.remove(), 450)
}

function minimizeCard(card) {
	const state = cardStates.get(card)
	if (!state || state.closing) return

	// 最小化动画：缩小并淡出到底部，结束时移除节点释放内存
	const runMinimize = () => {
		state.closing = true
		bringToFront(card)
		const bottom = Math.max(window.innerHeight - 24, 0)
		const targetLeft = clamp(
			state.left,
			16,
			Math.max(window.innerWidth - card.offsetWidth - 16, 16)
		)

		state.left = targetLeft
		state.top = bottom
		state.scale = 0.1
		state.angle = 0
		card.style.left = `${targetLeft}px`
		card.style.top = `${bottom}px`
		card.style.opacity = '0.35'
		applyTransform(card, state)

		const handleTransitionEnd = event => {
			if (event.propertyName === 'transform') {
				card.removeEventListener('transitionend', handleTransitionEnd)
				card.remove()
			}
		}

		card.addEventListener('transitionend', handleTransitionEnd)
	setTimeout(() => card.remove(), 450)
	}

	if (state.maximized) {
		restoreFromMaximize(card, state)
		requestAnimationFrame(() => {
			requestAnimationFrame(runMinimize)
		})
		return
	}

	runMinimize()
}

function toggleMaximize(card) {
	const state = cardStates.get(card)
	if (!state || state.closing) return

	if (state.maximized) {
		restoreFromMaximize(card, state)
	} else {
		maximizeCard(card, state)
	}
}

function maximizeCard(card, state) {
	if (activeMaximizedCard && activeMaximizedCard !== card) {
		const activeState = cardStates.get(activeMaximizedCard)
		if (activeState) {
			restoreFromMaximize(activeMaximizedCard, activeState)
		}
	}

	state.beforeMaximize = {
		left: state.left,
		top: state.top,
		scale: state.scale ?? 1,
		angle: state.angle ?? 0,
		width: card.offsetWidth,
		height: card.offsetHeight,
		inlinePosition: card.style.position
	}

	card.classList.add('maximized')
	card.style.position = 'fixed'
	card.style.left = '0px'
	card.style.top = '0px'
	card.style.width = '100vw'
	card.style.height = '100dvh'
	card.style.borderRadius = '0'

	state.left = 0
	state.top = 0
	state.scale = 1
	state.angle = 0
	applyTransform(card, state)
	activeMaximizedCard = card
	bringToFront(card)
	state.maximized = true
	updateBodyMaximizedState()
}

function restoreFromMaximize(card, state) {
	const previous = state.beforeMaximize
	if (!previous) return

	card.classList.remove('maximized')
	card.style.position = previous.inlinePosition || 'absolute'
	card.style.left = `${previous.left}px`
	card.style.top = `${previous.top}px`
	card.style.width = `${previous.width}px`
	card.style.height = `${previous.height}px`
	card.style.borderRadius = '12px'

	state.left = previous.left
	state.top = previous.top
	state.scale = previous.scale ?? 1
	state.angle = previous.angle ?? state.angle ?? 0
	applyTransform(card, state)
	state.maximized = false
	if (activeMaximizedCard === card) {
		activeMaximizedCard = null
		updateBodyMaximizedState()
	}
	bringToFront(card)
	setTimeout(() => {
		if (!state.maximized) {
			card.style.width = ''
			card.style.height = ''
			card.style.borderRadius = ''
			if (previous.inlinePosition) {
				card.style.position = previous.inlinePosition
			} else {
				card.style.position = ''
			}
			state.beforeMaximize = null
		}
	}, 360)
}

function startDrag(event, card) {
	const control = event.target.closest('.control')
	if (control) return

	const state = cardStates.get(card)
	if (!state || state.closing || state.maximized) return

	// 鼠标拖拽使用 rAF 节流，避免频繁触发布局计算
	event.preventDefault()
	bringToFront(card)

	const header = card.querySelector('.card-header')
	card.classList.add('dragging')
	header.classList.add('dragging')

	state.dragging = true
	state.dragOffsetX = event.clientX - state.left
	state.dragOffsetY = event.clientY - state.top

	let dragFrame = null
	let pendingLeft = state.left
	let pendingTop = state.top

	const commitDrag = () => {
		dragFrame = null
		const maxLeft = Math.max(window.innerWidth - card.offsetWidth, 0)
		const maxTop = Math.max(window.innerHeight - card.offsetHeight, 0)
		state.left = clamp(pendingLeft, -card.offsetWidth * 0.4, maxLeft)
		state.top = clamp(pendingTop, -card.offsetHeight * 0.4, maxTop)
		card.style.left = `${state.left}px`
		card.style.top = `${state.top}px`
	}

	const handlePointerMove = moveEvent => {
		if (!state.dragging) return

		pendingLeft = moveEvent.clientX - state.dragOffsetX
		pendingTop = moveEvent.clientY - state.dragOffsetY
		if (dragFrame === null) {
			dragFrame = requestAnimationFrame(commitDrag)
		}
	}

	const handlePointerUp = () => {
		state.dragging = false
		card.classList.remove('dragging')
		header.classList.remove('dragging')
		if (dragFrame !== null) {
			cancelAnimationFrame(dragFrame)
			commitDrag()
		}
		document.removeEventListener('pointermove', handlePointerMove)
		document.removeEventListener('pointerup', handlePointerUp)
	}

	document.addEventListener('pointermove', handlePointerMove)
	document.addEventListener('pointerup', handlePointerUp)
}

function createCard() {
	const message = messageQueue.pop()
	if (message === undefined) return false

	const card = document.createElement('div')
	card.className = 'card'

	const color = randomFrom(colors)
	const angleRange = isMobile ? 6 : 10
	const angle = (Math.random() - 0.5) * angleRange
	const entryScale = isMobile ? 0.8 : 0.65
	const cardWidth = isMobile ? 220 : 260
	const cardHeight = isMobile ? 150 : 160
	const horizontalMargin = isMobile ? 12 : 16
	const verticalMargin = isMobile ? 12 : 20
	const left =
		horizontalMargin +
		Math.random() *
			Math.max(window.innerWidth - cardWidth - horizontalMargin * 2, 0)
	const top =
		verticalMargin +
		Math.random() *
			Math.max(window.innerHeight - cardHeight - verticalMargin * 2, 0)

	card.style.background = color
	card.style.left = `${left}px`
	card.style.top = `${top}px`
	card.style.opacity = '0'
	if (activeMaximizedCard && zIndexCursor >= MAXIMIZED_LAYER - 2) {
		zIndexCursor = MAXIMIZED_LAYER - 2
	}
	card.style.zIndex = ++zIndexCursor

	card.innerHTML = `
		<div class="card-header">
			<div class="window-controls">
				<button class="control close" type="button" aria-label="关闭"></button>
				<button class="control minimize" type="button" aria-label="最小化"></button>
				<button class="control maximize" type="button" aria-label="最大化"></button>
			</div>
			<div class="card-title"></div>
		</div>
		<div class="card-body"></div>
	`

	card.querySelector(".card-title").textContent = tipTitle;
	card.querySelector(".card-body").textContent = message;

	const state = {
		angle,
		scale: entryScale,
		left,
		top,
		maximized: false,
		closing: false
	}

	cardStates.set(card, state)
	applyTransform(card, state)
	board.appendChild(card)

	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			state.scale = 1
			applyTransform(card, state)
			card.style.opacity = '1'
		})
	})

	if (board.children.length > maxCards) {
		const oldest = Array.from(board.children).find(item => item !== activeMaximizedCard && item !== card)
		if (oldest) {
			oldest.remove()
		}
	}
	return true
}


document.addEventListener('visibilitychange', () => {
	if (started && !document.hidden) {
		scheduleNextSpawn()
	}
})

if (typeof pointerMediaQuery.addEventListener === 'function') {
	pointerMediaQuery.addEventListener('change', syncMobileMode)
} else if (typeof pointerMediaQuery.addListener === 'function') {
	pointerMediaQuery.addListener(syncMobileMode)
}

window.addEventListener('resize', syncMobileMode)