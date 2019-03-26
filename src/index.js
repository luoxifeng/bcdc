/**
 * bridgeConnectDecoratorCreator
 * alias bcdc.js
 * {
 *      uuid: string | function,
 *      addThrough: boolean,
 *      removeThrough: boolean,
 *      flattenExport: boolean,
 *      group: boolean,
 * }
 * @param {*} opts 
 */
var bridge = {};

var _ = function bridgeConnectDecoratorCreator(opts = {}, addThrough = false, removeThrough = false, flattenExport = false, group = false) {
    /**
     * define
     */
    var limitOper = true; // limit external operation,是否限制操作bridge里存的数据，true：不能操作，false：可以操作
    var generateRandomId = () => +new Date() + (Math.random() * 1000).toFixed();
    var defCfg = {
        uuid: generateRandomId(),
        addThrough: false, // add装饰器是否允许穿透，true：允许，false：不允许
        removeThrough: false, // remove装饰器是否允许穿透，true：允许，false：不允许
        flattenExport: false, // 返回的三个装饰器是否需要展平输出，true：返回[left,add,remove],false:返回[left,[add,remove]]
        group: false,
    };
    var options = {};

    /**
     * LimitArray,禁止使用以下操作符修改brige里的数据，但还是可以通过其他操作实现修改数据，如arr[1]= 1;
     */
    class LimitArray extends Array {
        unshift(...args) {
            if (limitOper) throw new Error('could not use this operator, please use bridgeDecorator instead');
            super.unshift(...args);
        }

        push(...args) {
            if (limitOper) throw new Error('could not use this operator, please use bridgeDecorator instead');
            super.push(...args);
        }

        shift() {
            if (limitOper) throw new Error('could not use this operator, please use bridgeDecorator instead');
            super.shift();
        }

        pop() {
            if (limitOper) throw new Error('could not use this operator, please use bridgeDecorator instead');
            super.pop();
        }

        splice(...args) {
            if (limitOper) throw new Error('could not use this operator, please use bridgeDecorator instead');
            super.splice(...args);
        }
    }

    /**
     * compatible config
     */
    if (typeof opts === "string" || (typeof opts === "function" && (opts = opts() + '', true))) {
        opts = {
            uuid: opts,
            addThrough,
            removeThrough,
            flattenExport,
            group
        };
    } else if (typeof opts === "object") {

    } else {
        throw new TypeError(`the first parameter of bridgeConnectDecoratorCreator must be string | function | object`);
    }

    if (typeof opts.uuid === "function") {
        opts.uuid = opts.uuid();
    }

    Object.assign(options, defCfg, opts);

    /**
     * store
     */
    if (!bridge[options.uuid]) {
        bridge[options.uuid] = options.group ? {} : new LimitArray();
    }

    function getLeftTarget(groupId) {
        if (options.group) {
            if (!groupId) {
                throw new Error('groupId 必须');
            }
            return bridge[options.uuid][groupId];
        } 

        return bridge[options.uuid];
    }

    /**
     * bridgeLeft
     */
    function bridgeLeft(context) {
        return function get(target, key, decorator) {
            var lastValue = decorator.value;
            decorator.value = function (groupId) {
                return lastValue.call(context || this, getLeftTarget(groupId));
            };
            return decorator;
        };
    }

    Object.defineProperty(bridgeLeft, "getUUID", {
        value: function () {
            return options.uuid;
        },
        enumerable: true
    });

    Object.defineProperty(bridgeLeft, "getBridgeStore", {
        value: function () {
            var uuid = this.getUUID();
            return { [uuid]: bridge[uuid] || [] };
        },
        enumerable: true
    });

    Object.defineProperty(bridgeLeft, "clearBridgeStore", {
        value: function (uuid) {
            return delete bridge[uuid];
        },
        enumerable: true
    });


    function getRightTarget(groupId) {
        if (options.group) {
            if (!groupId) {
                throw new Error('groupId 必须');
            }
            if (!bridge[options.uuid][groupId]) bridge[options.uuid][groupId] = new LimitArray();
            return bridge[options.uuid][groupId];
        } 
        return bridge[options.uuid];
    }

    /**
     * bridgeRight
     * @param {*} context 
     * 
     */
    function bridgeRightAdd(target, key, decorator) {
        var lastValue = decorator.value;
        decorator.value = function (groupId) {
            let fun = () => { };
            limitOper = false;

            try {
                fun = lastValue.call(context || this);
                getRightTarget(groupId).push(fun);
            } catch (error) {
                console.error(error);
            }

            limitOper = true;

            return options.addThrough ? fun : lastValue;
        };
        return decorator;
    }

    function bridgeRightRemove(target, key, decorator) {
        var lastValue = decorator.value;
        decorator.value = function (groupId) {
            var fun = () => { };
            limitOper = false;

            try {
                fun = lastValue.call(context || this);
                var arr = getRightTarget(groupId);

                var index = arr.findIndex(fun);
                if (index > -1) arr.splice(index, 1);
                if (arr.length === 0 && options.group) delete bridge[options.uuid][groupId];
            } catch (error) {
                console.error(error);
            }
            
            limitOper = true;
            return options.removeThrough ? fun : lastValue;
        };
        return decorator;
    }

    function bridgeRight(context) {
        return [bridgeRightAdd, bridgeRightRemove];
    }

    return [bridgeLeft].concat(options.flattenExport ? bridgeRight() : bridgeRight);
};


Object.defineProperty(_, "getUUIDs", {
    value: function () {
        return Object.keys(bridge);
    },
    enumerable: true
});

Object.defineProperty(_, "getBridgeStore", {
    value: function (uuid) {
        if (typeof uuid === "undefined") return ({ ...bridge });
        return { [uuid]: bridge[uuid] || [] };
    },
    enumerable: true
});

Object.defineProperty(_, "clearBridgeStore", {
    value: function (uuid) {
        return uuid ? (delete bridge[uuid]) : (bridge = {}, true);
    },
    enumerable: true
});

module.exports = _;
