# `status` - [Results API](../README.md#results-api)

The `status` method of the results API returns information about a sessions current status and progress.

## HTTP Request

`GET /api/results/<session_token>/status`

## Response Payload

```json
{
  "token": "String",
  "test_files_count": {
    "<api_name>": "Number"
  },
  "test_files_completed": {
    "<api_name": "Number"
  },
  "status": "Enum['pending', 'running', 'paused', 'completed', 'aborted']",
  "date_started": "String",
  "date_finished": "String"
}
```

- **token** contains the token of the session corresponding to this status.
- **test_files_count** contains the number of test files per API.
- **test_files_completed** contains the number of test files executed per API.
- **status** specifies the current status of the session:
  - **pending**: The session was created, can receive updates, however cannot execute tests.
  - **running**: The session currently executes tests.
  - **paused**: The execution of tests in this session is currently paused.
  - **completed**: All tests files include in this session were executed and have a result.
  - **aborted**: The session was finished before all tests were executed.
- **date_started** contains the time the status changed from `PENDING` to `RUNNING` in unix epoch time milliseconds.
- **date_finished** contains the time the status changed to either `COMPLETED` or `ABORTED` in unix epoch time milliseconds.

## Example

**Request:**

`GET /api/results/d9caaae0-c362-11e9-943f-eedb305f22f6/status`

**Response:**

```json
{
  "token": "d9caaae0-c362-11e9-943f-eedb305f22f6",
  "test_files_count": {
    "2dcontext": 1
  },
  "test_files_completed": {},
  "status": "running",
  "date_started": "1567606879230",
  "date_finished": null
}
```
