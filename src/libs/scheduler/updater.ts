/**
 * updater scheduler
 * @version 1.0.0
 * @since 2023-05-27
 */
class updateScheduler {
  private _scheduler: Map<String, Set<Function>> = new Map()

  /**
   * add a function to the update scheduler
   * @param namespace namespace
   * @param fn function
   */
  public add(namespace: String, fn: Function) {
    if (!this._scheduler.has(namespace)) {
      this._scheduler.set(namespace, new Set())
    }
    this._scheduler.get(namespace)?.add(fn)
  }


  /**
   * remove a function from the update scheduler
   * @param namespace namespace
   * @param fn function
   * @returns {boolean} if the function is removed
   */
  public remove(namespace: String, fn: Function): boolean {
    if (!this._scheduler.has(namespace)) {
      return false
    }
    return this._scheduler.get(namespace)?.delete(fn) ?? false
  }

  /**
   * run the update scheduler
   */
  public run() {
    this._scheduler.forEach((value, key) => {
      value.forEach(fn => {
        fn()
      })
    })
  } 
}

export { updateScheduler }