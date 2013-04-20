package com.interopbridges.tools.build;

public class EntryPoint {
    public static void main(String[] args) {
        TestServer server = new TestServer(false, 9080);
        TestServer sslServer = new TestServer(true, 9443);
        
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
