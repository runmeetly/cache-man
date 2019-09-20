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
 * Checker verifies that arguments given to it are valid
 */
export class Checker {
  /**
   * Check that the provided resolver is present and valid
   *
   * @param {function} resolver - Resolver function
   * @return {boolean}
   */
  static resolver(resolver) {
    return !!resolver && typeof resolver === FUNCTION_TYPE;
  }

  /**
   * Check that the provided timeout is within allowable bounds
   *
   * @param {Number} timeoutInMillis - timeout
   * @return {boolean}
   */
  static timeout(timeoutInMillis) {
    return (
      !!timeoutInMillis &&
      typeof timeoutInMillis === NUMBER_TYPE &&
      timeoutInMillis > 0 &&
      timeoutInMillis < Number.MAX_SAFE_INTEGER
    );
  }

  /**
   * Check that the provided backend conforms to the StorageBackend contract
   *
   * @param {StorageBackend} backend - Storage backend
   * @return {boolean}
   */
  static backend(backend) {
    return !!backend && !!backend.get && !!backend.set;
  }
}
