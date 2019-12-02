
function createElement(type,props,...children){
	return {
		type,
		props:{
			...props,
			children:children.map(child=>{
				return typeof child === "object"?child:createTextElement(child);
			})
		}
	}
}

function createTextElement(text){
	return {
		type:"TEXT_ELEMENT",
		props:{
			nodeValue:text,
			children:[]
		}
	}
}

/** 创建dom树 */
function createDom(fiber){
	const dom = fiber.type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(fiber.type);

	updateDom(dom,{},fiber.props);

	return dom;
}

// 下一个要处理的任务
let nextUnitOfWork = null;
// 临时存贮的树
let wipRoot = null;
// 当前的dom树
let currentRoot = null;
// 要删除的节点
let deletions = null;

const isEvent = key => key.startsWith("on");
const isProperty = key => key !== "children" && !isEvent(key);
const isNew = (prev,next) => key => prev[key] !== next[key];
const isGone = (prev,next) => key => !(key in next);
/** 节点不同时，更新节点的方法 */
function updateDom(dom,prevProps,nextProps){

	//删除旧的事件监听，或更新监听事件函数
	Object.keys(prevProps)
		.filter(isEvent)
		.filter(key=> !(key in nextProps) || isNew(prevProps,nextProps)(key))
		.forEach(name=>{
			const eventType = name.toLowerCase().substring(2)
			dom.removeEventListener(eventType,prevProps[name]);
		})
	//增加新的事件监听
	Object.keys(nextProps)
		.filter(isEvent)
		.filter(isNew(prevProps,nextProps))
		.forEach(name=>{
			const eventType = name.toLowerCase().substring(2)
			dom.addEventListener(eventType,nextProps[name]);
		})

	//删除旧的属性
	Object.keys(prevProps)
		.filter(isProperty)
		.filter(isGone(prevProps,nextProps))
		.forEach(name =>{
			dom[name] = ""
		})
	//增加新的属性
	Object.keys(nextProps)
		.filter(isProperty)
		.filter(isNew(prevProps,nextProps))
		.forEach(name =>{
			dom[name] = nextProps[name]
		})
}

/** 合并dom树 */
function commitRoot(){
	deletions.forEach(commitWork);
	commitWork(wipRoot.child)
	currentRoot = wipRoot;
	wipRoot = null;
}

function commitWork(fiber){
	
	if(!fiber) return;
	
	let domParentFiber = fiber.parent;
	while(!domParentFiber.dom){
		domParentFiber = domParentFiber.parent;
	}
	const domParent = domParentFiber.dom;

	if(fiber.effectTag === "PLACEMENT" && fiber.dom != null){
		domParent.appendChild(fiber.dom);
	}else if(fiber.effectTag === "UPDATE" && fiber.dom != null){
		updateDom(fiber.dom,fiber.alternate.props,fiber.props)
	}else if(fiber.effectTag === "DELETION"){
		commitDeletion(fiber,domParent);
	}
	
	commitWork(fiber.child);
	commitWork(fiber.sibling)
}

function commitDeletion(fiber,domParent){
	if(fiber.dom){
		domParent.removeChild(fiber.dom);
	}else{
		commitDeletion(fiber.child,domParent)
	}
}

function render(element,container){
	wipRoot = {
		dom:container,
		props:{
			children:[element]
		},
		alternate:currentRoot
	}
	deletions = [];
	nextUnitOfWork = wipRoot;
}



/** 循环调用处理dom树 */
function workLoop(deadline){
	let shouldYield = false;
	while(nextUnitOfWork && !shouldYield){
		nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
		shouldYield = deadline.timeRemaining() <1
	}
	if(!nextUnitOfWork && wipRoot){
		console.log(wipRoot)
		commitRoot()
	}
	
	requestIdleCallback(workLoop);
}

/** 在浏览器空闲的时候去执行 */
requestIdleCallback(workLoop);

/** 拆分渲染树为小的单个任务 */
function performUnitOfWork(fiber){
	const isFunctionComponent = fiber.type instanceof Function;
	if(isFunctionComponent){
		updateFunctionComponent(fiber)
	}else{
		updateHostComponent(fiber);
	}
	
	if(fiber.child){
		return fiber.child
	}

	let nextFiber = fiber;
	while(nextFiber){
		if(nextFiber.sibling){
			return nextFiber.sibling;
		}
		nextFiber = nextFiber.parent;
	}
}

let wipFiber = null;
let hookIndex = null;

/** 更新函数组件 */
function updateFunctionComponent(fiber){
	wipFiber = fiber;
	hookIndex = 0;
	wipFiber.hooks = [];
	const children = [fiber.type(fiber.props)];
	reconcileChildren(fiber,children);
}

function useState(initial){
	const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];
	const hook = {
		state:oldHook?oldHook.state:initial,
		queue:[],
	};

	const actions = oldHook?oldHook.queue:[];
	actions.forEach(action=>{
		hook.state = action(hook.state)
	})

	const setState = action =>{
		hook.queue.push(action);
		wipRoot = {
			dom: currentRoot.dom,
			props: currentRoot.props,
			alternate: currentRoot,
		}
		nextUnitOfWork = wipRoot;
		deletions = [];
	}

	wipFiber.hooks.push(hook);
	hookIndex++;
	return [hook.state,setState];

}

function updateHostComponent(fiber){
	if (!fiber.dom) {
		fiber.dom = createDom(fiber);
	}

	reconcileChildren(fiber, fiber.props.children);
}

function reconcileChildren(wipFiber,elements){
	let index = 0;
	let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
	let prevSibling = null;

	while (index < elements.length || oldFiber != null) {
		const element = elements[index];
		let newFiber = null;

		//新旧dom对比
		const sameType = oldFiber && element && element.type == oldFiber.type;

		//相同的节点，只更新
		if(sameType){
			newFiber = {
				type: element.type,
				props: element.props,
				dom: oldFiber.dom,
				parent: wipFiber,
				alternate: oldFiber,
				effectTag: "UPDATE"
			}
		}
		//新增的节点
		if(element && !sameType){
			newFiber = {
				type: element.type,
				props: element.props,
				dom: null,
				parent: wipFiber,
				alternate: null,
				effectTag: "PLACEMENT"
			}
		}

		//删除旧的节点
		if(oldFiber && !sameType){
			oldFiber.effectTag = "DELETION";
			deletions.push(oldFiber);
		}

		if(oldFiber){
			oldFiber = oldFiber.sibling
		}

		if (index === 0) {
			wipFiber.child = newFiber;
		} else {
			prevSibling.sibling = newFiber;
		}

		prevSibling = newFiber;
		index++;
	}
}

const React = {
	createElement,
	useState
}

const ReactDOM = {
	render
}
export {ReactDOM};
export default React;