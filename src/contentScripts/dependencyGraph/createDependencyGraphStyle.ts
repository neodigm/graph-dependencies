export const jsonStyle = [
  {
    selector: 'node',
    style: {
      height: 'data(height)',
      width: 240,
      shape: 'rectangle',
      'background-opacity': '0',
    },
  },
  {
    selector: 'edge',
    style: {
      'curve-style': 'bezier',
        width: 8,
      'target-arrow-shape': 'triangle',
    },
  },
  {
    selector: 'edge:selected',
    style: {
      'curve-style': 'bezier',
      width: 6,
      'target-arrow-shape': 'triangle',
    },
  },
  {
    selector: 'node:selected',
    style: {
      'background-color': 'blue',
      'background-opacity': '0.5',
      width: 260,
      height: 'data(height)',
      'target-arrow-color': '#000',
      'text-outline-color': '#000',
    },
  },
  {
    selector: 'node:active',
    style: {
      'overlay-color': 'red',
      'overlay-padding': '14',
    },
  },
];
