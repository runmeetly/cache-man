/*
 *  Copyright 2019 Meetly Inc.
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

import { Validator } from "./Validator";

/**
 * Creates a new CacheMan instance
 *
 * @private
 * @param {Function} upstream - Upstream resolver function
 * @param {StorageBackend | Array<StorageBackend>} backend - cache StorageBackend implementation or list of implementations
 * @return {CacheManClass}
 */
export const createCache = (upstream, backend) => {
  const _upstream = Validator.resolver(upstream);
  const _backend = Validator.backend(backend);
  let _work = null;

  /**
   * Fetches new data from the upstream and caches the result
   *
   * @private
   * @param {Number} accessTime - Time at which the resolver was called
   * @param {Array<*> | undefined} args - Arguments
   * @return {Promise<*>}
   */
  const _newGet = (accessTime, ...args) => {
    let promise;

    // Grab the upstream data
    const potentialPromise = _upstream(...args);
    if (!!potentialPromise.then) {
      // If it has a .then, its a Promise enough for us
      promise = potentialPromise;
    } else {
      // No then, not a promise. Resolve it ourselves into a promise
      promise = Promise.resolve(potentialPromise);
    }

    // Fetch payload from the upstream and deliver the data
    return promise
      .then(result => {
        // Cache the fetch results for the next go around
        _setBackend(result, accessTime);
        return result;
      })
      .catch(error => {
        // Erase cached data in the event that an error occurs
        _setBackend(null, 0);

        // Rethrow to continue the chain
        throw error;
      });
  };

  /**
   * Insert data into the backend - can handle if the backend is a list or just a single implementation
   *
   * @private
   * @param {*} data - Data to insert
   * @param {Number} time - Time insertion occurs
   */
  const _setBackend = (data, time) => {
    if (Array.isArray(_backend)) {
      for (const b of _backend) {
        b.set(data, time);
      }
    } else {
      _backend.set(data, time);
    }
  };

  /**
   * Fetch data from the upstream resolver
   *
   * Begins a new upstream fetch if no current work is happening, else
   * this attaches to the existing work and debounces other requests.
   *
   * @private
   * @param {Number} accessTime - Time at which the resolver was called
   * @param {Array<*> | undefined } args - Arguments
   * @return {Promise<*>}
   */
  const _get = (accessTime, ...args) => {
    if (!_work) {
      _work = _newGet(accessTime, ...args)
        .then(result => {
          _work = null;
          return result;
        })
        .catch(error => {
          _work = null;
          throw error;
        });
    }

    return _work;
  };

  /**
   * Given cached data, evaluate it and either resolve or continue a Promise
   *
   * @private
   * @param {*|undefined|null} cached - Possibly cached data
   * @param {Number} now - Current time
   * @param {*} resolve - Promise resolver
   * @param {*} reject - Promise rejector
   * @param {Array<*> | undefined} args - Function arguments
   */
  const _getPromise = (cached, now, resolve, reject, ...args) => {
    if (!cached) {
      _get(now, ...args)
        .then(result => resolve(result))
        .catch(error => reject(error));
    } else {
      resolve(cached);
    }
  };

  /**
   * CacheMan instance which knows how to retrieve data from a cache and clear stale data.
   */
  class CacheManClass {
    /**
     * Hits the upstream and uses the caching strategy
     *
     * @param {Array<*> | undefined} args - Arguments
     * @return {Promise<*>}
     */
    get = (...args) => {
      return new Promise((resolve, reject) => {
        const now = Date.now();
        if (Array.isArray(_backend)) {
          let gotFromCache = false;
          for (const b of _backend) {
            const cached = b.get();
            if (!!cached) {
              _getPromise(cached, now, resolve, reject, ...args);
              gotFromCache = true;
              break;
            }
          }

          if (!gotFromCache) {
            _getPromise(null, now, resolve, reject, ...args);
          }
        } else {
          const cached = _backend.get();
          _getPromise(cached, now, resolve, reject, ...args);
        }
      });
    };

    /**
     * Delete cached data and start over
     */
    clear = () => {
      _setBackend(null, 0);
      _work = null;
    };
  }

  return new CacheManClass();
};
