var parse = require('css-annotation').parse

module.exports = function plugin (options) {

    options = options || {}

    return function (root) {
        css = options.css !== undefined ? options.css : root;
        removeCheck = options.removeBase !== undefined ? options.removeBase :  true;

        var matchedRules = []

        var annotations = parse(css);

        root.walkRules(function (node) {
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
                    if (count) {
                        tmpSelectors.push(tmp.include)
                    }
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
        root.walkRules(function (rule) {
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

        matchedRules.forEach(function (matchedRule) {
            root.walk(function (rule) {
                rule.semicolon = true;
                if (rule.type === 'atrule') {
                    rule.nodes.forEach(function (rule) {
                        if (checkInclude(rule)) {
                            if (matchedRule.include === rule.selector) {
                                includeTmp.forEach(function (tmp) {
                                    if (tmp.selector === matchedRule.base && matchedRule.include === rule.selector) {
                                    tmp.decls.forEach(function (decl) {
                                        rule.append({
                                            prop: decl.prop,
                                            value: decl.value
                                        })
                                    })
                                    if (removeCheck) removeBase(root)
                                    }
                                })
                            }
                        }

                    })
                }
                else {
                    if (checkInclude(rule)) {
                        includeTmp.forEach(function (tmp) {
                            if (tmp.selector === matchedRule.base && matchedRule.include === rule.selector) {
                                tmp.decls.forEach(function (decl) {
                                    rule.append({
                                        prop: decl.prop,
                                        value: decl.value
                                    })
                                })
                                if (removeCheck) removeBase(root)
                            }
                        })
                    }
                }
            })
        })

        return root

    }
}


function removeBase (root) {
    root.walk(function (rule) {
        if (rule.type === 'rule' && checkBase(rule) && !rule.change) {
            rule.removeSelf()
        }
        if (rule.type === 'atrule') {
            rule.walk(function (node) {
                if (node.type === 'rule' && checkBase(node)) {
                    node.removeSelf()
                }
            })
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
    root.walkRules(function (rule) {
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
    root.walkRules(function (rule) {
        if (checkInclude(rule)) {
            includeRules.push(rule)
        }
    })
    return includeRules
}
