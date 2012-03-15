package com.interopbridges.tools.build;

public class EntryPoint {
    public static void main(String[] args) {
        TestServer server = new TestServer(false, 8080);
        TestServer sslServer = new TestServer(true, 8443);
        
        try {
            server.start();
            sslServer.start();
            server.join();
            sslServer.join();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }    
}
