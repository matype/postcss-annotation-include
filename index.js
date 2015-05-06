var parse = require('css-annotation').parse

module.exports = function plugin () {

    return function (root) {
        var matchedRules = []

        var annotations = parse(root)

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
                rule.nodes.forEach(function (child) {
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
                rule.nodes.forEach(function (rule) {
                    if (checkInclude(rule)) {
                        includeTmp.forEach(function (tmp) {
                            tmp.decls.forEach(function (decl) {
                                rule.append({
                                    prop: decl.prop,
                                    value: decl.value
                                })
                            })
                            removeBase(root)
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
                        removeBase(root)
                    })
                }
            }
        })

        return root

    }
}


function removeBase (root) {
    root.each(function (rule) {
        if (checkBase(rule) && !rule.change) {
            rule.removeSelf()
        }
    })
}

function checkBase (node) {
    if (node.nodes) {
        var children = node.nodes
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
    if (node.nodes) {
        var children = node.nodes
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
