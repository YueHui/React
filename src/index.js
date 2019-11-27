import React,{ReactDOM} from './react';

/** @jsx React.createElement */
const element = (
	<div>
		<h1>hello</h1>
	</div>
);

const container = document.getElementById("root");
ReactDOM.render(element, container);

