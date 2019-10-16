# CacheMan

`CacheMan` is an ES6, Promise based caching library.  
It requires zero dependencies.

## Install

```shell script

$ npm i @runmeetly/cache-man

$ yarn add @runmeetly/cache-man

```

## Why

`CacheMan` is an extremely simple, low attachment, easy to adopt library.
It was created because we needed a simple way to avoid repeated network
and database calls while developing Meetly in its early stages, but with
an API which would be easy to migrate away from as the application grew
and matured.

<sub>Plus its always fun to make something new!</sub>

## How

Imagine you have some existing code, such as this:

```javascript
class Api {
  constructor(http, database) {
    this.http = http;
    this.database = database;
  }

  doLongNetworkCall(id, filterBy) {
    return this.http.get(`/api/${id}/${filterBy}`);
  }

  doExpensiveDataBaseCall(name, date) {
    return this.database.query(name).orderBy(date);
  }
}
```

Both of the functions in your `Api` may take a very long time. Let's
assume that you run these functions to populate page data each time your
page is navigated to. If a user was to rapidly clicks back and forth between
your pages, you would make these expensive calls over and over again - even
if no data had actually changed in between invocations.

`CacheMan` can help you here, let's see how:

```javascript
import { CacheMan } from "@runmeetly/cache-man";

class Api {
  constructor(http, database) {
    this.cachedLongNetworkCall = CacheMan.create((id, filterBy) => {
      return http.get(`/api/${id}/${filterBy}`);
    });

    this.cachedExpensiveDatabaseCall = CacheMan.create((name, date) => {
      return database.query(name).orderBy(date);
    });
  }

  doLongNetworkCall(id, filterBy) {
    return this.cachedLongNetworkCall.get(id, filterBy);
  }

  doExpensiveDataBaseCall(name, date) {
    return this.cachedExpensiveDatabaseCall.get(name, data);
  }
}
```

By wrapping function calls with `CacheMan.create`, we effectively create
a simple repository pattern - it will hit the network or the database as
long as there is no cached data, and will quickly return from the cached
data if it is possible.

## The CacheMan API

The `CacheMan` object is the main entry point to the meat and potatoes of
the library. It has a single function, which takes an `upstream` callback,
a `timeoutInMillis`, and optionally an implementation of a `StorageBackend`.
It will return a new cache interface which knows how to talk to and
manipulate its cached data.

```javascript
const upstream = (...args) => {};
const timeoutInMillis = 10000;
const backend = new CustomStorageBackend();

cacheInterface = CacheMan.create(upstream, {
  timeout: timeoutInMillis,
  backend: backend
});
```

This `cacheInterface` has two functions: `get()` and `clear()`.

```javascript
cacheInterface.get(...args);

cacheInterface.clear();
```

#### get

The `get()` function accepts any number of `arguments` and forwards all
of them to the originally passed `upstream` callback. It will return a
`Promise`. The `Promise` data may be new data from the `upstream` or
it may be data that was previously cached.

Repeated calls to `get()` while the `upstream` function has not returned
any data will join to the original call and return when the
original `upstream` resolves it's `Promise`.

#### clear

The `clear()` function accepts no arguments and returns no data. It erases
the cached data - effectively "resetting" the cache interface.

Calls to `clear()` that are made during a `get()` call will not affect any
of the `get()` calls up to that point.

# Credit

`CacheMan` is primarily developed and maintained by
[Peter](https://github.com/pyamsoft) at
[Meetly](https://www.runmeetly.com).

# License

```
 Copyright 2019 Meetly Inc.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```
