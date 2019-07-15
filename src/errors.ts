
export interface ErrorConfig {
	/** 在Object块中遇到文件结束 */
	EOF_IN_OBJECT?: string
	/** 在应该是值得地方遇到文件结束 */
	EOF_IN_VALUE?: string
	/** 在Array块中遇到文件结束 */
	EOF_IN_ARRAY?: string
	/** 在解析数字的时候遇到文件结束 */
	EOF_IN_NUMBER?: string
	/** 字符串中遇到了换行 */
	BR_IN_STRING?: string
	/** 在解析字符串的时候遇到文件结束 */
	EOF_IN_STRING?: string
	/** 本来应该是某些值，但是却得到了别的值 */
	EXPECT_BUT?: (expect: Array<string>, but: string) => string
}

//错误列表
export const errorsConfig: ErrorConfig = {
	EOF_IN_OBJECT: 'Got EOF in object',
	EOF_IN_VALUE: 'Need a value, but EOF got',
	EOF_IN_ARRAY: 'Got EOF in array',
	EOF_IN_NUMBER: 'Got EOF in number',
	EOF_IN_STRING: 'Got EOF in object',
	BR_IN_STRING: 'Got break line in string',
	EXPECT_BUT: (e, b) => `Expect ${e.map(ei => `'${ei}'`).join(',')}, but '${b}' got`
}

/**
 * 配置错误提示
 * @param errors 错误信息
 */
export function setError(errors: Partial<ErrorConfig>): void {
	Object.keys(errors).forEach(key => {
		(errorsConfig as any)[key] = (errors as any)[key]
	})
}