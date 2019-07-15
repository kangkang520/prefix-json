import { ErrorConfig, errorsConfig } from './errors'

export interface IPosition {
	startLine: number
	startCol: number
	endLine: number
	endCol: number
}

/** 键值对数据  */
export interface IObjectData {
	kind: 'object'
	datas: { [i: string]: DataTypes }
	pos: IPosition
}

/** 数组数据 */
export interface IArrayData {
	kind: 'array'
	datas: Array<DataTypes>
	pos: IPosition
}

/** 数字数据 */
export interface INumberData {
	kind: 'number'
	data: number
	pos: IPosition
}

/** 布尔数据 */
export interface IBooleanData {
	kind: 'boolean'
	data: boolean
	pos: IPosition
}

/** 字符串数据 */
export interface IStringData {
	kind: 'string'
	data: string
	pos: IPosition
}

/** 空数据 */
export interface INullData {
	kind: 'null'
	pos: IPosition
}

/** 自定义数据 */
export interface ICustomData {
	kind: 'common'
	prefix: string
	data: string
	pos: IPosition
}

/** 数据类型 */
export type DataTypes = IObjectData | IArrayData | INumberData | IBooleanData | IStringData | INullData | ICustomData

/** 转换错误 */
export class ParseError extends Error {
	constructor(msg: string, public readonly line: number, public readonly col: number) {
		super(msg)
	}
}

/**
 * 将文件内容解析为语法树
 * @param content 文件内容
 */
export function parseAst(content: string): IObjectData {
	//数据读取标识
	let index = 0, line = 0, col = 0

	const NAME_START = ['a-z', 'A-Z', '_', '$']

	//向后面跳步
	function next(step = 1) {
		function next1() {
			index++
			if (content[index] == '\n') {
				line++
				col = 0
			}
			else col++
		}
		for (let i = 0; i < step; i++) next1()
	}

	//取字符
	function ch(step = 0) {
		if (eoc(step)) return null
		return content[index + step]
	}

	//跳过空白或注释
	function skipSpace() {
		while (['\r', '\n', ' ', '\t'].includes(content[index])) next()
		//注释
		if (is('//')) {
			next(2)
			while (true) {
				if (content[index] == '\n') break
				next()
			}
			skipSpace()
		}
	}

	//内容是否结束
	function eoc(step = 0) {
		return index + step >= content.length
	}

	//检测当前是否以制定的字符串开头
	function is(str: string, step = 0) {
		for (let i = 0; i < str.length; i++) {
			if (content[index + step + i] != str[i]) return false
		}
		return true
	}

	//抛出异常
	function error(name: keyof ErrorConfig, args?: Array<any>): never {
		let msg = errorsConfig[name]
		if (typeof msg == 'function') msg = (msg as any)(...args || [])
		throw new ParseError(msg as string, line, col)
	}

	//读取名称
	function parseName() {
		let buffer = ''
		while (true) {
			const c = ch()
			if (c && /[a-zA-Z0-9_$]/.test(c)) buffer += c
			else break
			next()
		}
		return buffer
	}

	//转换字符串
	function parseString(sb: string): IStringData {
		let buffer = ''
		let l = line, c = col
		//跳过开始
		next()
		while (true) {
			let c = ch()
			if (!c) return error('EOF_IN_STRING')
			//遇到字符串符号退出
			if (c == sb) {
				next()
				break
			}
			if (c == '\n') return error('BR_IN_STRING')
			//转移字符串
			if (c == '\\') {
				next()
				c = ch()
			}
			buffer += c
			next()
		}
		//返回结果
		return {
			kind: 'string',
			data: buffer,
			pos: { startLine: l, startCol: c, endLine: line, endCol: col }
		}
	}

	//转换boolean
	function parseBoolean(val: boolean): IBooleanData {
		const l = line, c = col
		next(val ? 4 : 5)
		return {
			kind: 'boolean',
			data: val,
			pos: { startLine: l, startCol: c, endLine: line, endCol: col }
		}
	}

	//转换null
	function parseNull(): INullData {
		const l = line, c = col
		next(4)
		return {
			kind: 'null',
			pos: { startLine: l, startCol: c, endLine: line, endCol: col }
		}
	}

	//转换数字
	function parseNumber(): INumberData {
		const l = line, c = col
		let buffer = ''
		let isFloat = false
		while (true) {
			const c = ch()
			if (!c) return error('EOF_IN_NUMBER')
			//小数点处理
			if (c == '.') {
				if (!isFloat) isFloat = true
				else break		//遇到小数点后又遇到小数点，这就不对了
			}
			//非数字则退出
			else if (!/\d/.test(c)) break
			buffer += c
			next()
		}
		return {
			kind: 'number',
			data: isFloat ? parseFloat(buffer) : parseInt(buffer),
			pos: { startLine: l, startCol: c, endLine: line, endCol: col }
		}
	}

	//转换数组
	function parseArray(): IArrayData {
		const l = line, c = col
		const values: Array<DataTypes> = []
		//跳过[
		next()
		//一直转换知道遇到]
		while (true) {
			skipSpace()
			let c = ch()
			if (!c) return error('EOF_IN_ARRAY')
			//数组结束
			if (c == ']') {
				next()
				break
			}
			const val = parseValue()
			values.push(val)
			//解析逗号
			skipSpace()
			c = ch()
			if (c == ']') continue		//留给下一次处理
			if (c != ',') return error('EXPECT_BUT', [[','], c])
			next()
		}
		return {
			kind: 'array',
			datas: values,
			pos: { startLine: l, startCol: c, endLine: line, endCol: col }
		}
	}

	//转换自定义数据
	function parseCustom(): ICustomData {
		const l = line, c = col
		//读取前缀
		const prefix = parseName()
		//读取字符串
		const _c = ch()
		if (_c != '"' && _c != "'") return error('EXPECT_BUT', [['"', "'"], c])
		const data = parseString(_c)
		return {
			kind: 'common',
			prefix, data: data.data,
			pos: { startLine: l, startCol: c, endLine: line, endCol: col }
		}
	}

	//转换键值对
	function parseObject(): IObjectData {
		const l = line, c = col
		const datas: IObjectData['datas'] = {}
		//忽略开头的“{”
		next()
		//读取键值对直到遇到“}”
		while (true) {
			skipSpace()
			let c = ch()
			if (!c) return error('EOF_IN_OBJECT')
			//已经结束了
			if (c == '}') {
				next()
				break
			}
			//读取键（可能有引号包裹）
			let key = (c == '"' || c == "'") ? parseString(c).data : parseName()
			if (!key) return error('EXPECT_BUT', [NAME_START, c])
			//读取冒号
			skipSpace()
			c = ch()
			if (c != ':') return error('EXPECT_BUT', [[':'], c])
			next()
			//读取值
			skipSpace()
			datas[key] = parseValue()
			//读取逗号
			skipSpace()
			c = ch()
			if (c == '}') continue		//下次处理
			else if (c != ',') return error('EXPECT_BUT', [[','], c])
			next()
		}
		//返回结果
		return {
			kind: 'object',
			datas,
			pos: { startLine: l, startCol: c, endLine: line, endCol: col }
		}
	}

	//值选择器
	function parseValue(): DataTypes {
		const c = ch()
		if (!c) return error('EOF_IN_VALUE')
		if (c == '"' || c == "'") return parseString(c)
		else if (c == '[') return parseArray()
		else if (c == '{') return parseObject()
		else if (is('true')) return parseBoolean(true)
		else if (is('false')) return parseBoolean(false)
		else if (is('null')) return parseNull()
		else if (/\d/.test(c)) return parseNumber()
		else return parseCustom()
	}

	return parseObject()
}