# 带前缀的JSON

除了JSON本身的特性之外，还支持这样的一些特性：
* 允许为json字符串增加前缀，例如: 可以使用`D"../static"`来表示目录（*前缀可以自定义*）。
* 支持注释，支持“//”注释。
* Object类型或Array类型的最后一个元素允许以“`,`”结束。
* json中键不用加引号

## 安装
```
npm install --save prefix-json
```

## 使用
使用方法很简单，请看下面的例子。
```typescript
import * as parser from 'prefix-json'
const config = parser.parse(path_of_config_file, {
    //当遇到D前缀时，会使用这里的函数进行转换
    D: ({file, val}) => path.resolve(path.dirname(file), val)
})
console.log(config)
```

## 使用AST
如果默认的`parse`函数不能满足需求，也可以自己对AST进行处理。

使用`parseAst`函数可以将给定的内容解析为抽象语法树。

## 自定义错误
可以导入系统现有的文件进行设置，也可以自行设置。

* 如果使用现有的，可以这样做
	```typescript
	import 'prefix-json/dist/locale/zh-cn'
	```
* 如果要自定义，可以这样做
	```
	import {setError} from 'prefix-json'
	setError({
		EOF_IN_OBJECT:'这是错误信息',
		//... 其他错误，具体请查阅.d.ts文件。
	})
	```