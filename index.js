var parse = require('css-annotation').parse

module.exports = function plugin (css, options) {
    options = options || {}

    var annotations = parse(css)

    return function (root) {
        var matchedRules = []

        root.eachRule(function (node) {
            if (checkInclude(node)) {
                annotations.forEach(function (annotation) {
                    if (node.selector === annotation.rule) {
                        var res = {}
                        res.include = node.selector
                        if (!Array.isArray(annotation.include)) {
                            annotation.include = [annotation.include]
                        }
                        res.base = annotation.include
                        matchedRules.push(res)
                    }
                })
            }
        })

        var tmpMatched = []
        var newMatched = []
        matchedRules.forEach(function (matchedRule) {
            matchedRule.base.forEach(function (base) {
                tmpMatched.push({
                    include: matchedRule.include,
                    base: base
                })
            })
        })
        tmpMatched.forEach(function (tmp, i) {
            var tmpSelectors = []
            var count = true
            var isOne = true
            for (var j = i + 1; j < tmpMatched.length; j++) {
                if (tmp.base === tmpMatched[j].base) {
                    if (count) tmpSelectors.push(tmp.include)
                    tmpSelectors.push(tmpMatched[j].include)
                    count = false
                    isOne = false
                    tmpMatched.splice(j, 1)
                }
            }
            var newSelector  = tmpSelectors.join(',\n')
            if (newSelector) {
                newMatched.push({
                    include: newSelector,
                    base: tmp.base
                })
            }
            if (isOne) {
                newMatched.push({
                    include: tmp.include,
                    base: tmp.base
                })
            }
        })
        matchedRules = newMatched


        includeTmp = []
        root.eachRule(function (rule) {
            if (checkBase(rule)) {
                var decls = []
                rule.childs.forEach(function (child) {
                    if (child.type === 'decl') {
                        decls.push({
                            prop: child.prop,
                            value: child.value
                        })
                    }
                })
                includeTmp.push({
                    selector: rule.selector,
                    decls: decls
                })
            }
        })

        root.each(function (rule) {
            if (rule.type === 'atrule') {
                rule.childs.forEach(function (rule) {
                    if (checkInclude(rule)) {
                        includeTmp.forEach(function (tmp) {
                            tmp.decls.forEach(function (decl) {
                                rule.append({
                                    prop: decl.prop,
                                    value: decl.value
                                })
                            })
                        })
                    }

                })
            }
            else {
                if (checkInclude(rule)) {
                    includeTmp.forEach(function (tmp) {
                        tmp.decls.forEach(function (decl) {
                            rule.append({
                                prop: decl.prop,
                                value: decl.value
                            })
                        })
                    })
                }
            }
        })

        root.each(function (rule) {
            if (checkBase(rule)) rule.removeSelf()
        })

        return root

    }
}

function checkBase (node) {
    if (node.childs) {
        var children = node.childs
        var text = ''
        children.forEach(function (child) {
            if (child.type === 'comment') text = child.text
        })
        if (text.match(/\@base/)) return true
    }
    return false
}

function baseRules (root) {
    var baseRules = []
    root.eachRule(function (rule) {
        if (checkBase(rule)) {
            baseRules.push(rule)
        }
    })
    return baseRules
}

function checkInclude (node) {
    if (node.childs) {
        var children = node.childs
        var text = ''
        children.forEach(function (child) {
            if (child.type === 'comment') text = child.text
        })
        if (text.match(/\@include/)) return true
    }
    return false
}

function includeRules (root) {
    var includeRules = []
    root.eachRule(function (rule) {
        if (checkInclude(rule)) {
            includeRules.push(rule)
        }
    })
    return includeRules
}
