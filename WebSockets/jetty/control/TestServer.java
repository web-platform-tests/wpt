package com.interopbridges.tools.build;

import java.io.IOException;
import java.util.ArrayList;
import java.util.UUID;

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
   
    static ArrayList<ControlWebSocket> controlChannelList = new ArrayList<ControlWebSocket>();
	
    public static boolean Associate(UUID idControlChannel, UUID idWebSocket)
	{
		// Look thru the list of control channels and find the one that has the guid of idControlChannel.
        // If the control channel can't be found or is already associated with a websocket, then fail.
        // Otherwise, associate the websocket with that control channel.
		for(ControlWebSocket controlChannel : controlChannelList)
		{	
			if (controlChannel._idControlChannel.equals(idControlChannel))
            {
                if (controlChannel._idWebSocket == null)
                {
                    controlChannel._idWebSocket = idWebSocket;
                    return true;
                }
                else
                {
                    return false;
                }
            }
		}
		return false;
	}
    
    public static void SendTelemetry(UUID idWebSocket, String message)
    {
        // Look thru the list of control channels and find the one that has an associated websocket guid
        for (ControlWebSocket controlChannel : controlChannelList)
        {
            if (controlChannel._idWebSocket.equals(idWebSocket))
            {
            	try
            	{
            		controlChannel._connection.sendMessage(message);
            	}catch(IOException e)
                {	
            		System.err.println("Exception");
            	}
                return;
            }
        }
    }
    
    @SuppressWarnings("deprecation")
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
    			else if (request.getPathInfo().equalsIgnoreCase("/control")){
    				System.err.println("Accepted \"ws://localhost:" + _connector.getPort() + "/control\" websocket connection from " + request.getLocalAddr());
    				return new ControlWebSocket();
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
	        _connector2.setPort(9081);
	        addConnector(_connector2);
        }
    }
    
    class EchoWebSocket implements WebSocket.OnTextMessage, WebSocket.OnBinaryMessage
    {
    	Connection _connection;
    	UUID _idWebSocket;
    	
    	public void onOpen(Connection connection)
        {
        	_connection = connection;
        	_connection.setMaxBinaryMessageSize(70000); // 70,000 bytes message max
        	_connection.setMaxTextMessageSize(70000); // 70,000 bytes message max
        	_connection.setMaxIdleTime(600000); // 10 minute idle timer
        	_idWebSocket = UUID.randomUUID();
        }

        @SuppressWarnings("static-access")
		public void onMessage(String data)
        {    
        	try
        	{
	        	if (data.equalsIgnoreCase(".close"))
	        	{
	        		_connection.close();
	        		return;
	        	}
	        	else if(data.startsWith(".associate"))
	        	{
	        		UUID idControlChannel = null;
	        		String guidString = data.substring(".associate ".length());
	        		idControlChannel = UUID.fromString(guidString);
	                if (null==idControlChannel || !Associate(idControlChannel, _idWebSocket))
	                {
	                    System.err.println("Unable to associate controlchannel: "+ idControlChannel.toString()+ "  with websocket: "+ _idWebSocket.toString());
	                    _connection.sendMessage("ERROR");
	                }
	                else
	                {
	                	System.err.println("Associating controlchannel: "+ idControlChannel.toString()+ "  with websocket: "+ _idWebSocket.toString());
	                	_connection.sendMessage("OK");
	                }
	        	}
        	         	
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
			SendTelemetry(_idWebSocket, "CLOSE,"+arg0+","+arg1);
		}
		
    }
    
    class ControlWebSocket implements WebSocket.OnTextMessage
    {
    	Connection _connection;
    	UUID _idControlChannel = null;
    	UUID _idWebSocket = null;   	
    	    	
    	public void onOpen(Connection connection)
        {
    		_connection = connection;
    		_idControlChannel = UUID.randomUUID();
    		controlChannelList.add(this);
        }
    	
    	public void onMessage(String data)
        { 
    		try
    		{
	        	if (data.equalsIgnoreCase(".getid"))
	        	{
	        		String result = _idControlChannel.toString();
	        		_connection.sendMessage(result);
	        	}        	
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
    		controlChannelList.remove(this);
		}
    }
}
