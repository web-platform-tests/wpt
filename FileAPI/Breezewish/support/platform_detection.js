function returnByPlatform(result)
{

    if (navigator.appVersion.indexOf("Win") != -1) {
        return result.win;
    } else {
        return result.unix;
    }

}