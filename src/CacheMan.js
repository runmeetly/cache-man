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

/**
 * Used to validate the provided resolver
 *
 * Makes sure that the resolver is of the same type as whatever the engine
 * considers a function type to be.
 * @private
 */
const FUNCTION_TYPE = typeof function() {};

/**
 * Used to validate the provided timeout
 *
 * Makes sure that the timeout is of the same type as whatever the engine
 * considers a number type to be.
 * @private
 */
const NUMBER_TYPE = typeof 1;

/**
 * Throw an error
 *
 * @private
 * @param {string} message - Provided error message
 */
const error = message => {
  throw new Error(message);
};

/**
 * Validate that the provided resolver is present and valid
 *
 * @private
 * @param {function} resolver - Resolver function
 * @return {function}
 */
const validateResolver = resolver => {
  if (!resolver || typeof resolver !== FUNCTION_TYPE) {
    error("upstream must be a callback (...) -> Promise");
  }

  return resolver;
};

/**
 * Validate that the provided timeout is within allowable bounds
 *
 * @private
 * @param {Number} timeoutInMillis - timeout
 * @return {Number}
 */
const validateTimeout = timeoutInMillis => {
  if (
    !timeoutInMillis ||
    typeof timeoutInMillis !== NUMBER_TYPE ||
    timeoutInMillis <= 0 ||
    timeoutInMillis >= Number.MAX_SAFE_INTEGER
  ) {
    error("timeout must be greater than 0 and less than 2^53 - 1");
  }

  return timeoutInMillis;
};

/**
 * Validate that the provided backend conforms to the StorageBackend contract
 *
 * @private
 * @param {StorageBackend} backend - Storage backend
 * @return {StorageBackend}
 */
const validateBackend = backend => {
  if (!backend || !backend.get || !backend.set) {
    error("StorageBackend must be an object with get() and set(data) methods!");
  }

  return backend;
};

/**
 * Creates a new CacheMan instance
 *
 * @private
 * @param {function} upstream - Upstream resolver function
 * @param {Number} timeoutInMillis - cache invalidation time
 * @param {StorageBackend} backend - cache StorageBackend implementation
 * @return {CacheManClass}
 */
const create = (upstream, timeoutInMillis, backend) => {
  const _upstream = validateResolver(upstream);
  const _backend = validateBackend(backend);
  const _timeout = validateTimeout(timeoutInMillis);
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
        _backend.set(result, accessTime);
        return result;
      })
      .catch(error => {
        // Erase cached data in the event that an error occurs
        _backend.set(null, 0);

        // Rethrow to continue the chain
        throw error;
      });
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
   * CacheMan instance which knows how to retrieve data from a cache and clear stale data.
   */
  class CacheManClass {
    /**
     * Hits the upstream and uses the caching strategy
     *
     * @param {Array<*> | undefined } args - Arguments
     * @return {Promise<*>}
     */
    get = (...args) => {
      return new Promise((resolve, reject) => {
        const now = Date.now();
        const cached = _backend.get(_timeout);
        if (!cached) {
          _get(now, ...args)
            .then(result => resolve(result))
            .catch(error => reject(error));
        } else {
          resolve(cached);
        }
      });
    };

    /**
     * Delete cached data and start over
     */
    clear = () => {
      _backend.set(null, 0);
      _work = null;
    };
  }

  return new CacheManClass();
};

/**
 * @typedef {{set: set, get: get}} StorageBackend
 * Creates a StorageBackend which holds its data in memory
 *
 * @private
 * @return {StorageBackend | {set: set, get: get}}
 */
const createDefaultStorageBackend = function createDefaultStorageBackend() {
  let storage = null;
  let lastAccessTime = 0;

  return {
    // If we have no cached data, or the cached data we do have is outside of the TTL
    get: function(timeout) {
      if (!storage || lastAccessTime + timeout < Date.now()) {
        return null;
      } else {
        return storage;
      }
    },

    set: function(data, accessTime) {
      storage = data;
      lastAccessTime = accessTime;
    }
  };
};

/**
 * The CacheMan library
 */
export class CacheMan {
  /**
   * Creates a new CacheMan instance
   *
   * @param upstream - The upstream data source to fetch from. Should speak Promise.
   * @param timeoutInMillis - Timeout in milliseconds until any data held in the cache is invalidated.
   * @param backend - The StorageBackend that holds the cached data - held in memory by default.
   * @return {CacheManClass}
   */
  static create(upstream, timeoutInMillis = 2 * 60 * 1000, backend = null) {
    let storageBackend = backend;
    if (!storageBackend) {
      // No storage backend was provided, use the default
      storageBackend = createDefaultStorageBackend();
    }

    return create(upstream, timeoutInMillis, storageBackend);
  }
}
