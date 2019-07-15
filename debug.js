const tsNode = require('ts-node')
const path = require('path')

tsNode.register({
	files: true,
	project: path.join(__dirname, './tsconfig.json')
})
global.debugMode = true

require('./test/test')