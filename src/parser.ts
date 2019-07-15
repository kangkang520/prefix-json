import fs from 'fs'
import { parseAst, DataTypes } from './ast'

export interface IResolverParam {
	/** 配置文件路径 */
	file: string
	/** 前缀名称 */
	prefix: string
	/** 描述值 */
	val: string
}

//值转换
function parseValue(ast: DataTypes, file: string, resolvers: { [i: string]: (param: IResolverParam) => any }): any {
	if (ast.kind == 'null') return null
	if (ast.kind == 'number') return ast.data
	if (ast.kind == 'string') return ast.data
	if (ast.kind == 'boolean') return ast.data
	if (ast.kind == 'array') return ast.datas.map(di => {
		return parseValue(di, file, resolvers)
	})
	if (ast.kind == 'object') {
		const obj: any = {}
		Object.keys(ast.datas).forEach(key => {
			obj[key] = parseValue(ast.datas[key], file, resolvers)
		})
		return obj
	}
	if (ast.kind == 'common') {
		if (!resolvers[ast.prefix]) return null
		return resolvers[ast.prefix]({ file, prefix: ast.prefix, val: ast.data })
	}
	return null
}

/**
 * 解析配置文件并得到结果
 * @param file 配置文件
 * @param resolvers 自定义配置处理函数
 */
export function parse(file: string, resolvers?: { [i: string]: (param: IResolverParam) => any }): any {
	const content = fs.readFileSync(file) + ''
	const ast = parseAst(content)
	return parseValue(ast, file, resolvers || {})
}