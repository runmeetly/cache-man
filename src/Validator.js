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

import { Checker } from "./Checker";

/**
 * Throw an error
 *
 * @private
 * @param {string} message - Provided error message
 * @param {*} what - Error object
 */
const error = (message, what) => {
  console.error(message, what);
  throw new Error(message);
};

/**
 * Validator verifies that arguments given to it are valid
 */
export class Validator {
  /**
   * Validate that the provided resolver is present and valid
   *
   * @param {Function} resolver - Resolver function
   * @return {Function}
   */
  static resolver(resolver) {
    if (!Checker.resolver(resolver)) {
      error("upstream must be a callback (...) -> Promise", resolver);
    }

    return resolver;
  }

  /**
   * Validate that the provided timeout is within allowable bounds
   *
   * @param {Number} timeoutInMillis - timeout
   * @return {Number}
   */
  static timeout(timeoutInMillis) {
    if (!Checker.timeout(timeoutInMillis)) {
      error(
        "timeout must be greater than 0 and less than 2^53 - 1: ",
        timeoutInMillis
      );
    }

    return timeoutInMillis;
  }

  /**
   * Validate that the provided backend conforms to the StorageBackend contract
   *
   * @param {StorageBackend} backend - Storage backend
   * @return {StorageBackend}
   */
  static backend(backend) {
    if (!Checker.backend(backend)) {
      error(
        "backend must be an object with get(), set(*, number), and timeout",
        backend
      );
    }

    return backend;
  }
}
