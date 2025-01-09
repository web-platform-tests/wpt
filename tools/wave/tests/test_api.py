# mypy: allow-untyped-defs

# import requests
# import json
# import copy
#
#
# def test_import_results():
#    # Arrange
#    token = create_session()
#    print(token)
#    tests = read_available_tests()
#    apis = list(tests.keys())
#    api = apis[0]
#    test = tests[api][0]
#    set_session_tests(token, [test])
#    print(api)
#    print(test)
#    start_session(token)
#    read_next_test(token)
#    create_positive_result(token, test)
#    read_next_test(token)
#
#    # Act
#    url = "/".join([get_url(), "api/results", token, api, "json"])
#    r = requests.get(url)
#    old_results = copy.deepcopy(r.json())
#
#    new_results = copy.deepcopy(old_results)
#    new_results["results"][0]["subtests"].append({"name": "Subtest ab", "status": "FAIL", "message": None})
#    url = "/".join([get_url(), "api/results", token, api, "json"])
#    r = requests.post(url, data=json.dumps(new_results))
#    status_code = r.status_code
#
#    url = "/".join([get_url(), "api/results", token, api, "json"])
#    r = requests.get(url)
#    updated_results = r.json()
#
#    # Assert
#    assert status_code == 200
#    assert updated_results == new_results
#    assert updated_results != old_results
#
#    # CleanUp
#    delete_session(token)
#
#
# def test_last_completed_tests():
#    # Arrange
#    token = create_session()
#    print(token)
#    tests = read_available_tests()
#    apis = list(tests.keys())
#    api = apis[0]
#    test = tests[api][0]
#    set_session_tests(token, [test])
#    print(api)
#    print(test)
#    start_session(token)
#    read_next_test(token)
#    create_timed_out_result(token, test)
#    read_next_test(token)
#
#    # Act
#    url = "/".join([get_url(), "api/tests/", token, "/last_completed"])
#    r = requests.get(url)
#    status_code = r.status_code
#
#    # url = "/".join([get_url(), "api/results", token, api, "json"])
#    # r = requests.get(url)
#    # updated_results = r.json()
#
#    # Assert
#    assert status_code == 200
#
#    # CleanUp
#    delete_session(token)
#
#
# def create_session():
#    url = "/".join([get_url(), "api/sessions"])
#    r = requests.post(url)
#    response_payload = r.json()
#    token = response_payload["token"]
#    return token
#
#
# def read_session(token):
#    url = "/".join([get_url(), "api/sessions", token])
#    r = requests.get(url)
#    session = r.json()
#    return session
#
#
# def read_session_status(token):
#    url = "/".join([get_url(), "api/sessions", token, "status"])
#    r = requests.get(url)
#    status = r.json()
#    return status
#
#
# def read_available_tests():
#    url = "/".join([get_url(), "api/tests"])
#    r = requests.get(url)
#    tests = r.json()
#    return tests
#
#
# def set_session_tests(token, tests):
#    url = "/".join([get_url(), "api/sessions", token])
#    config = {"tests": {"include": tests}}
#
#    requests.put(url, data=json.dumps(config))
#
#
# def read_next_test(token):
#    url = "/".join([get_url(), "api/tests", token, "next"])
#    r = requests.get(url)
#    next_test = r.json()["next_test"]
#    return next_test
#
#
# def start_session(token):
#    url = "/".join([get_url(), "api/sessions", token, "start"])
#    requests.post(url)
#
#
# def create_result(token, test, result):
#    url = "/".join([get_url(), "api/results", token])
#    r = requests.post(url, data=json.dumps(result))
#    print(r.status_code)
#    print(result)
#
#
# def create_positive_result(token, test):
#    result = {
#        "test": test,
#        "status": "OK",
#        "message": None,
#        "subtests": [{"name": "Subtest xy", "status": "PASS", "message": None}],
#    }
#
#    create_result(token, test, result)
#
#
# def create_timed_out_result(token, test):
#    result = {"test": test, "status": "TIMEOUT", "message": None, "subtests": []}
#
#    create_result(token, test, result)
#
#
# def read_session_tests(token):
#    url = "/".join([get_url(), "api/tests", token])
#    r = requests.get(url)
#    tests = r.json()
#    return tests
#
#
# def delete_session(token):
#    url = "/".join([get_url(), "api/sessions", token])
#    requests.delete(url)
#
#
# def get_url():
#    host = "127.0.0.1:8000"
#    base_url = "_wave"
#    return "/".join(["http:/", host, base_url])
#
