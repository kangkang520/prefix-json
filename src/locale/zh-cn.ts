import { setError } from "../errors"

setError({
	EOF_IN_OBJECT: 'Object异常结束',
	EOF_IN_VALUE: '希望是一个值，但是却结束了',
	EOF_IN_ARRAY: 'Array异常结束',
	EOF_IN_NUMBER: 'Number异常结束',
	EOF_IN_STRING: 'String异常结束',
	BR_IN_STRING: 'String遇到了换行',
	EXPECT_BUT: (e, b) => `希望得到${e.map(ei => `'${ei}'`).join(',')}, 但却得到'${b}'`
})