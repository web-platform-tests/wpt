/*
 * This file is part of the RELAX NG schemas far (X)HTML5. 
 * Please see the file named LICENSE in the relaxng directory for 
 * license details.
 */

/*
 * To compile and run, you need at least:
 * http://hsivonen.iki.fi/code/fi.iki.hsivonen.io-util-xml.jar
 * http://hsivonen.iki.fi/validator-about/htmlpalser.jar
 * Jing http://thaiopensource.com/relaxng/jing.html
 */

package org.whattf.syntax;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.MalformedURLException;

import javax.xml.parsers.SAXParserFactory;

import org.xml.sax.ErrorHandler;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;
import org.xml.sax.XMLReader;

import com.thaiopensource.util.PropertyMap;
import com.thaiopensource.util.PropertyMapBuilder;
import com.thaiopensource.validate.Schema;
import com.thaiopensource.validate.SchemaReader;
import com.thaiopensource.validate.ValidateProperty;
import com.thaiopensource.validate.Validator;
import com.thaiopensource.validate.rng.CompactSchemaReader;
import com.thaiopensource.xml.sax.CountingErrorHandler;
import com.thaiopensource.xml.sax.XMLReaderCreator;

import fi.iki.hsivonen.htmlparser.HtmlParser;
import fi.iki.hsivonen.xml.NullEntityResolver;
import fi.iki.hsivonen.xml.SystemErrErrorHandler;

/**
 * 
 * @version $Id$
 * @author hsivonen
 */
public class Driver {

    private PrintWriter err;
    
    private Schema mainSchema;

    private Schema exclusionSchema;

    private Validator validator;

    private SystemErrErrorHandler errorHandler = new SystemErrErrorHandler();
    
    private CountingErrorHandler countingErrorHandler = new CountingErrorHandler();
    
    private XMLReader htmlParser = new HtmlParser();
    
    private XMLReader xmlParser;
    
    private boolean failed = false;

    /**
     * @param basePath
     */
    public Driver() {  
        try {
            this.err = new PrintWriter(new OutputStreamWriter(System.err, "UTF-8"));

            SAXParserFactory factory = SAXParserFactory.newInstance();
            factory.setNamespaceAware(true);
            factory.setValidating(false);
            this.xmlParser = factory.newSAXParser().getXMLReader();
        } catch (Exception e) {
            // If this happens, the JDK is too broken anyway
            throw new RuntimeException(e);
        }
    }

    private Schema rncSchemaByFilename(File name) {
        PropertyMapBuilder pmb = new PropertyMapBuilder();
        pmb.put(ValidateProperty.ERROR_HANDLER, errorHandler);
        pmb.put(ValidateProperty.ENTITY_RESOLVER, new NullEntityResolver());
        pmb.put(ValidateProperty.XML_READER_CREATOR,
                new DriverXMLReaderCreator());
        PropertyMap jingPropertyMap = pmb.toPropertyMap();

        InputSource schemaInput;
        try {
            schemaInput = new InputSource(name.toURL().toString());
        } catch (MalformedURLException e1) {
            System.err.println();
            e1.printStackTrace(err);
            failed = true;
            return null;
        }
        SchemaReader sr = CompactSchemaReader.getInstance();
        Schema sch = null;
        try {
            sch = sr.createSchema(schemaInput, jingPropertyMap);
        } catch (Exception e) {
            failed = true;
        }
        return sch;
    }

    private void checkFile(File file) throws IOException, SAXException {
        validator.reset();
        InputSource is = new InputSource(new FileInputStream(file));
        is.setSystemId(file.toURL().toString());
        if(file.getName().endsWith(".html")) {
            is.setEncoding("UTF-8");
            htmlParser.parse(is);
        } else if(file.getName().endsWith(".xhtml")) {
            xmlParser.parse(is);
        }
    }

    private void checkValidFiles(File directory) {
        setup(errorHandler);
        File[] files = directory.listFiles();
        for (int i = 0; i < files.length; i++) {
            File file = files[i];
            if(file.isFile()) {
                errorHandler.reset();
                try {
                    checkFile(file);
                } catch (IOException e) {
                } catch (SAXException e) {
                }
                if (errorHandler.isInError()) {
                    failed = true;
                }
            }
        }
    }

    private void checkInvalidFiles(File directory) {
        setup(countingErrorHandler);
        File[] files = directory.listFiles();
        for (int i = 0; i < files.length; i++) {
            File file = files[i];
            if(file.isFile()) {
                countingErrorHandler.reset();
                try {
                    checkFile(file);
                } catch (IOException e) {
                } catch (SAXException e) {
                }
                if (!countingErrorHandler.getHadErrorOrFatalError()) {
                    failed = true;
                }
            }
        }
    }
    
    private void checkDirectory(File directory, File schema) {
        mainSchema = rncSchemaByFilename(schema);
        if (failed) {
            return;
        }
        File[] files = directory.listFiles();
        for (int i = 0; i < files.length; i++) {
            File file = files[i];
            if ("valid".equals(file.getName())) {
                checkValidFiles(file);
            }
            if ("invalid".equals(file.getName())) {
                checkInvalidFiles(file);
            }
        }
    }
    
    /**
     * 
     */
    private void setup(ErrorHandler eh) {
        PropertyMapBuilder pmb = new PropertyMapBuilder();
        pmb.put(ValidateProperty.ERROR_HANDLER, eh);
        pmb.put(ValidateProperty.ENTITY_RESOLVER, new NullEntityResolver());
        pmb.put(ValidateProperty.XML_READER_CREATOR,
                new DriverXMLReaderCreator());
        PropertyMap jingPropertyMap = pmb.toPropertyMap();
        
        validator = mainSchema.createValidator(jingPropertyMap);
        // Validator exclusionValidator = exclusionSchema.createValidator(jingPropertyMap);
        // validator = new CombineValidator(validator, exclusionValidator);
        
        htmlParser.setContentHandler(validator.getContentHandler());
        htmlParser.setErrorHandler(eh);
        xmlParser.setContentHandler(validator.getContentHandler());
        xmlParser.setErrorHandler(eh);
    }
    
    
    
    public boolean check() {
        // exclusionSchema = rncSchemaByFilename(new File("html5exclusions.rnc"));
        checkDirectory(new File("tests/html5core/"), new File("xhtml5core.rnc"));
        
        return !failed;
    }

    /**
     * @param args
     */
    public static void main(String[] args) {
        Driver d = new Driver();
        if (d.check()) {
            System.exit(0);
        } else {
            System.exit(-1);
        }
    }

    public class DriverXMLReaderCreator implements XMLReaderCreator {
        /**
         * @see com.thaiopensource.xml.sax.XMLReaderCreator#createXMLReader()
         */
        public XMLReader createXMLReader() throws SAXException {
            throw new SAXException("Jing tried to create an XMLReader.");
        }
    }
}
