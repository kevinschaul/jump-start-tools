import { default as ReactD3LineChart } from "../starters/react-d3/LineChart/preview.js"
import { default as ReactD3Chart } from "../starters/react-d3/Chart/preview.js"
type ComponentMap = {
  [key: string]: () => JSX.Element;
};
export const componentMap: ComponentMap = {
"react-d3/LineChart": ReactD3LineChart,
"react-d3/Chart": ReactD3Chart,
};