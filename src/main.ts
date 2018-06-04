export class AsyncMapNode<K, V> {
    readonly asyncId: number
    protected _map?: Map<K, V>
    protected _names?: Set<string>
    protected _parent?: AsyncMapNode<K, V>
    constructor(asyncId: number, parent?: AsyncMapNode<K, V>) {
        this._parent = parent
        this.asyncId = asyncId
    }
    getNames () {
        return this._names ? Array.from(this._names) : []
    }
    hasName (name: string) {
        return !!this._names && this._names.has(name)
    }
    alias (name: string) {
        if (!this._names) {
            this._names = new Set()
        }
        this._names.add(name)
        return this
    }
    createChild (asyncId: number): this {
        return new (this.constructor as any)(asyncId, this)
    }

    has (key: K, recurse?: boolean): boolean {
        if (!recurse) {
            return !!this._map && this._map.has(key)
        } else {
            let t: AsyncMapNode<K, V> | undefined
            for (t = this; t; t = t._parent) {
                if (t._map && t._map.has(key)) {
                    return true
                }
            }
            return false
        }
    }
    get (key: K): V | undefined {
        let t: AsyncMapNode<K, V> | undefined
        for (t = this; t; t = t._parent) {
            if (t._map && t._map.has(key)) {
                return t._map.get(key)
            }
        }
    }
    set (key: K, value: V): this {
        if (!this._map) {
            this._map = new Map()
        }
        this._map.set(key, value)
        return this
    }
    clear (): void {
        if (this._map) {
            this._map.clear()
        }
    }
    delete (key: K): boolean {
        if (this._map) {
            return this._map.delete(key)
        }
        return false
    }
    closest (name: string) {
        const p = this.parent(name)
        if (!p) {
            throw new Error('cant find parent with name:' + name)
        }
        return p
    }
    parent (name?: string) {
        if (!name) {
            return this._parent
        }
        let t: AsyncMapNode<K, V> | undefined
        for (t = this; t; t = t._parent) {
            if (t.hasName(name)) {
                return t
            }
        }
    }
}

export class AsyncHookMap<K, V>{
    protected _store: { [k: number]: AsyncMapNode<K, V> } = {}
    protected _hook: {
        enable (): void
        disable (): void
    }
    protected _asyncHooks!: any

    constructor(asyncHooksImpl?: any) {
        this._asyncHooks = asyncHooksImpl || require('async_hooks')
        const asyncId = this._asyncHooks.executionAsyncId()
        this._store[asyncId] = new AsyncMapNode(asyncId)
        this._store[asyncId].alias('root')
        this._hook = this._asyncHooks.createHook({
            destroy: (asyncId: number) => {
                delete this._store[asyncId]
            },
            init: (asyncId: number, type: string, triggerAsyncId: number, resource: any) => {
                const n = this._store[triggerAsyncId]
                if (n) {
                    this._store[asyncId] = n.createChild(asyncId)
                }
            },
        }).enable()
    }


    executionAsyncId (): number {
        return this._asyncHooks.executionAsyncId()
    }

    current () {
        const asyncId = this.executionAsyncId()
        return this._store[asyncId]
    }
    /**
     * add alias of AsyncNode, a AsyncNode can own multi names
     * 
     * @param {string} name 
     * @returns {this} 
     */
    alias (name: string): this {
        this.current().alias(name)
        return this
    }

    /**
     * check the alias name
     * 
     * @param {string} name 
     * @returns {this} 
     */
    hasName (name: string) {
        return this.current().hasName(name)
    }

    /**
     * get parent AsyncNode
     * if name provided , return the named closest AsyncNode
     * this method will throw an error if there is no parent
     * 
     * @param {string} [name] 
     * @returns {TinyMap<K, V>} 
     * @memberof AsyncStorageInterface
     */
    parent (name?: string) {
        return this.current().parent(name)
    }

    /**
     * alias of parent
     * 
     * @param {string} name 
     * @returns 
     * @memberof AsyncStorage
     */
    closest (name: string) {
        return this.current().closest(name)
    }

    /**
     * get from AsyncStorage
     * 
     * @param {K} key 
     * @returns {(V | undefined)} 
     * @memberof AsyncStorage
     */
    get (key: K): V | undefined {
        return this.current().get(key)
    }

    /**
     * check key
     * @param key 
     * @param recursion check forefathers?
     */
    has (key: K, recursion = true) {
        return this.current().has(key, recursion)
    }

    /**
     * set value to current async AsyncNode
     * effect current AsyncNode and children
     * 
     * @param {K} key 
     * @param {V} value 
     * @returns {this} 
     * @memberof AsyncStorage
     */
    set (key: K, value: V): this {
        this.current().set(key, value)
        return this
    }

    /**
     * delete the value of current AsyncNode
     * 
     * @param {K} key 
     * @returns {boolean} 
     * @memberof AsyncStorage
     */
    delete (key: K): boolean {
        return this.current().delete(key)
    }

    /**
     * clear the current AsyncNode
     * 
     * @memberof AsyncStorage
     */
    clear (): void {
        this.current().clear()
    }

    printPath () {
        const arr: string[] = []
        const fs = require('fs')
        for (let t = this.current(); t; t = t.parent()!) {
            const names = t.getNames()
            if (names.length > 0) {
                arr.push(`${t.asyncId}(${names.join('')})`)
            } else {
                arr.push(`${t.asyncId}`)
            }
        }
        fs.writeFileSync(1, '\n' + arr.reverse().join('--') + '\n')
    }
}