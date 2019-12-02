import React,{ReactDOM} from './react';

/** @jsx React.createElement */
function App(){
	const [state,setState] = React.useState(1);
	return <div>
		<h1>count: {state}</h1>
		<button onClick={()=>setState(v=>v+1)}>加1</button>
	</div>
}

const container = document.getElementById("root");
ReactDOM.render(<App />, container);

