import { AsyncHookMap } from './main';

export { AsyncHookMap }

let instance!: AsyncHookMap
Object.defineProperty(exports, 'default', {
    get () {
        if (instance) {
            return instance
        }
        instance = new AsyncHookMap()
        return instance
    },
    set () {
        // ignore
    }
})

// for lazy init
const _default: AsyncHookMap = null as any as AsyncHookMap;
export default _default;
