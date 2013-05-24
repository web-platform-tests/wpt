package com.interopbridges.tools.build;

import java.io.IOException;
import javax.servlet.http.HttpServletRequest;

import org.eclipse.jetty.server.Connector;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.ResourceHandler;
import org.eclipse.jetty.server.nio.SelectChannelConnector;
import org.eclipse.jetty.server.ssl.SslSelectChannelConnector;
import org.eclipse.jetty.websocket.WebSocket;
import org.eclipse.jetty.websocket.WebSocketHandler;

public class TestServer extends Server
{
    Connector _connector;
    Connector _connector2;
    WebSocketHandler _wsHandler;
    ResourceHandler _rHandler;
   
    public TestServer(Boolean useSsl, int port)
    {
    	if (useSsl) {
            _connector = new SslSelectChannelConnector();
  	        ((SslSelectChannelConnector)_connector).getSslContextFactory().setKeyManagerPassword("Html5Labs!!");
  	        ((SslSelectChannelConnector)_connector).getSslContextFactory().setKeyStorePassword("Html5Labs!!");
  	        ((SslSelectChannelConnector)_connector).getSslContextFactory().setKeyStore("keystore.chain");
  	        //((SslSelectChannelConnector)_connector).getSslContextFactory().setKeyStoreType("pkcs12");
  	        _connector.setPort(port);
    	} else {
	    	_connector = new SelectChannelConnector();
	        _connector.setPort(port);
    	}

        addConnector(_connector);
		
		_wsHandler = new WebSocketHandler()
        {			
            @Override
            public WebSocket doWebSocketConnect(HttpServletRequest request, String protocol)
            {                     	
    			if (request.getPathInfo().equalsIgnoreCase("/echo")) {
                    System.err.println("Accepted \"ws://localhost:" + _connector.getPort() + "/echo\" websocket connection from " + request.getLocalAddr());		                
	                return new EchoWebSocket();
    			}
            	
            	return null;
            }
        };
        
        setHandler(_wsHandler);
        
        if (!useSsl) {
	        _rHandler=new ResourceHandler();
	        _rHandler.setDirectoriesListed(true);
	        _rHandler.setResourceBase("WebContent");
	        _wsHandler.setHandler(_rHandler);
	        
	        _connector2 = new SelectChannelConnector();
	        _connector2.setPort(8081);
	        addConnector(_connector2);
        }
    }
    
    class EchoWebSocket implements WebSocket.OnTextMessage, WebSocket.OnBinaryMessage
    {
    	Connection _connection;
    	
    	public void onOpen(Connection connection)
        {
        	_connection = connection;
        	_connection.setMaxBinaryMessageSize(70000); // 70,000 bytes message max
        	_connection.setMaxTextMessageSize(70000); // 70,000 bytes message max
        	_connection.setMaxIdleTime(600000); // 10 minute idle timer
        }

        public void onMessage(String data)
        {        	
        	if (data.equalsIgnoreCase(".close"))
        	{
        		_connection.close();
        		return;
        	}
        	  
        	try
        	{
        		if(_connection.isOpen())
        			_connection.sendMessage(data);
        	}
        	catch (IOException e)
        	{
        	}
        }
        
        public void onMessage(byte[] array, int arg1, int arg2)
        {        	
        	try
        	{
        		if (_connection.isOpen())
                    _connection.sendMessage(array, arg1, arg2);
            }
            catch (IOException e)
            {	
        	}
        }

		public void onClose(int arg0, String arg1)
		{
			// The default for Jetty is to automatically echo the close
			// frame sending back the same payload.  We don't need to
			// override this default.
		}
    }
}
