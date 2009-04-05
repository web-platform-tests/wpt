/*
 * This file is part of the RELAX NG schemas far (X)HTML5. 
 * Please see the file named LICENSE in the relaxng directory for 
 * license details.
 */

package org.whattf.syntax;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.MalformedURLException;

import nu.validator.gnu.xml.aelfred2.SAXDriver;
import nu.validator.htmlparser.sax.HtmlParser;
import nu.validator.xml.IdFilter;
import nu.validator.xml.SystemErrErrorHandler;

import org.whattf.checker.NormalizationChecker;
import org.whattf.checker.TextContentChecker;
import org.whattf.checker.jing.CheckerSchema;
import org.whattf.checker.jing.CheckerValidator;
import org.whattf.checker.table.TableChecker;
import org.xml.sax.ErrorHandler;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;
import org.xml.sax.SAXNotSupportedException;
import org.xml.sax.XMLReader;

import com.thaiopensource.relaxng.impl.CombineValidator;
import com.thaiopensource.util.PropertyMap;
import com.thaiopensource.util.PropertyMapBuilder;
import com.thaiopensource.validate.Schema;
import com.thaiopensource.validate.SchemaReader;
import com.thaiopensource.validate.ValidateProperty;
import com.thaiopensource.validate.Validator;
import com.thaiopensource.validate.auto.AutoSchemaReader;
import com.thaiopensource.validate.prop.rng.RngProperty;
import com.thaiopensource.validate.rng.CompactSchemaReader;
import com.thaiopensource.xml.sax.CountingErrorHandler;
import com.thaiopensource.xml.sax.Jaxp11XMLReaderCreator;


/**
 * 
 * @version $Id$
 * @author hsivonen
 */
public class Driver {

    private static final String PATH = "syntax/relaxng/tests/";
    
    private PrintWriter err;

    private PrintWriter out;

    private Schema mainSchema;

    private Schema assertionSchema;

    private Validator validator;

    private SystemErrErrorHandler errorHandler = new SystemErrErrorHandler();

    private CountingErrorHandler countingErrorHandler = new CountingErrorHandler();

    private HtmlParser htmlParser = new HtmlParser();

    private XMLReader xmlParser;

    private boolean failed = false;

    private boolean verbose;

    /**
     * @param basePath
     */
    public Driver(boolean verbose) {
        this.verbose = verbose;
        try {
            this.err = new PrintWriter(new OutputStreamWriter(System.err,
                    "UTF-8"));
            this.out = new PrintWriter(new OutputStreamWriter(System.out,
                    "UTF-8"));
            /*
             * SAXParserFactory factory = SAXParserFactory.newInstance();
             * factory.setNamespaceAware(true); factory.setValidating(false);
             * XMLReader parser = factory.newSAXParser().getXMLReader();
             */
            this.xmlParser = new IdFilter(new SAXDriver());
        } catch (Exception e) {
            // If this happens, the JDK is too broken anyway
            throw new RuntimeException(e);
        }
    }

    private Schema schemaByFilename(File name) throws Exception {
        PropertyMapBuilder pmb = new PropertyMapBuilder();
        pmb.put(ValidateProperty.ERROR_HANDLER, errorHandler);
        pmb.put(ValidateProperty.XML_READER_CREATOR,
                new Jaxp11XMLReaderCreator());
        RngProperty.CHECK_ID_IDREF.add(pmb);
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
        SchemaReader sr;
        if (name.getName().endsWith(".rnc")) {
            sr = CompactSchemaReader.getInstance();
        } else {
            sr = new AutoSchemaReader();
        }
        return sr.createSchema(schemaInput, jingPropertyMap);
    }

    private void checkFile(File file) throws IOException, SAXException {
        validator.reset();
        InputSource is = new InputSource(new FileInputStream(file));
        is.setSystemId(file.toURL().toString());
        String name = file.getName();
        if (name.endsWith(".html") || name.endsWith(".htm")) {
            is.setEncoding("UTF-8");
            if (verbose) {
                out.println(file);
                out.flush();
            }
            htmlParser.parse(is);
        } else if (name.endsWith(".xhtml") || name.endsWith(".xht")) {
            if (verbose) {
                out.println(file);
                out.flush();
            }
            xmlParser.parse(is);
        }
    }

    private boolean isCheckableFile(File file) {
        String name = file.getName();
        return file.isFile()
                && (name.endsWith(".html") || name.endsWith(".htm")
                        || name.endsWith(".xhtml") || name.endsWith(".xht"));
    }

    private void checkValidFiles(File directory) {
        File[] files = directory.listFiles();
        for (int i = 0; i < files.length; i++) {
            File file = files[i];
            if (isCheckableFile(file)) {
                errorHandler.reset();
                try {
                    checkFile(file);
                } catch (IOException e) {
                } catch (SAXException e) {
                }
                if (errorHandler.isInError()) {
                    failed = true;
                }
            } else if (file.isDirectory()) {
                checkValidFiles(file);
            }
        }
    }

    private void checkInvalidFiles(File directory) {
        File[] files = directory.listFiles();
        for (int i = 0; i < files.length; i++) {
            File file = files[i];
            if (isCheckableFile(file)) {
                countingErrorHandler.reset();
                try {
                    checkFile(file);
                } catch (IOException e) {
                } catch (SAXException e) {
                }
                if (!countingErrorHandler.getHadErrorOrFatalError()) {
                    failed = true;
                    try {
                        err.println(file.toURL().toString()
                                + " was supposed to be invalid but was not.");
                        err.flush();
                    } catch (MalformedURLException e) {
                        throw new RuntimeException(e);
                    }
                }
            } else if (file.isDirectory()) {
                checkInvalidFiles(file);
            }
        }
    }

    private void checkDirectory(File directory, File schema) throws SAXException {
        try {
            mainSchema = schemaByFilename(schema);
        } catch (Exception e) {
            err.println("Reading schema failed. Skipping test directory.");
            e.printStackTrace();
            err.flush();
            return;
        }
        File[] files = directory.listFiles();
        for (int i = 0; i < files.length; i++) {
            File file = files[i];
            if ("valid".equals(file.getName())) {
                setup(errorHandler);
                checkValidFiles(file);
            } else if ("invalid".equals(file.getName())) {
                setup(countingErrorHandler);
                checkInvalidFiles(file);
            }
        }
    }

    /**
     * @throws SAXNotSupportedException 
     * @throws SAXdException 
     * 
     */
    private void setup(ErrorHandler eh) throws SAXException {
        PropertyMapBuilder pmb = new PropertyMapBuilder();
        pmb.put(ValidateProperty.ERROR_HANDLER, eh);
        pmb.put(ValidateProperty.XML_READER_CREATOR,
                new Jaxp11XMLReaderCreator());
        RngProperty.CHECK_ID_IDREF.add(pmb);
        PropertyMap jingPropertyMap = pmb.toPropertyMap();

        validator = mainSchema.createValidator(jingPropertyMap);
        Validator assertionValidator = assertionSchema.createValidator(jingPropertyMap);
        validator = new CombineValidator(validator, assertionValidator);
        validator = new CombineValidator(validator, new CheckerValidator(
                new TableChecker(), jingPropertyMap));
        validator = new CombineValidator(validator, new CheckerValidator(
                new NormalizationChecker(), jingPropertyMap));
        validator = new CombineValidator(validator, new CheckerValidator(
                new TextContentChecker(), jingPropertyMap));

        htmlParser.setContentHandler(validator.getContentHandler());
        htmlParser.setErrorHandler(eh);
        htmlParser.setFeature("http://xml.org/sax/features/unicode-normalization-checking", true);
        xmlParser.setContentHandler(validator.getContentHandler());
        xmlParser.setErrorHandler(eh);
        xmlParser.setFeature("http://xml.org/sax/features/unicode-normalization-checking", true);
        htmlParser.setMappingLangToXmlLang(true);
    }

    public boolean check() throws SAXException {
        try {
            assertionSchema = CheckerSchema.ASSERTION_SCH;
        } catch (Exception e) {
            err.println("Reading schema failed. Terminating.");
            e.printStackTrace();
            err.flush();
            return false;
        }

        checkDirectory(new File(PATH + "html5core/"), new File(PATH + "../xhtml5core.rnc"));
        checkDirectory(new File(PATH + "html5core-plus-web-forms2/"), new File(
                PATH + "../xhtml5core-plus-web-forms2.rnc"));
        checkDirectory(new File(PATH + "html5full-html/"), new File(
                PATH + "../html5full.rnc"));
        checkDirectory(new File(PATH + "html5full-xhtml/"), new File(
                PATH + "../xhtml5full-xhtml.rnc"));
        checkDirectory(new File(PATH + "assertions/"), new File(
                PATH + "../xhtml5full-xhtml.rnc"));

        checkDirectory(new File(PATH + "tables/"), new File(PATH + "../xhtml5full-xhtml.rnc"));
        checkDirectory(new File(PATH + "media-queries/"), new File(PATH + "../html5full.rnc"));
        checkDirectory(new File(PATH + "mime-types/"), new File(PATH + "../html5full.rnc"));
        if (verbose) {
            if (failed) {
                out.println("Failure!");
            } else {
                out.println("Success!");
            }
        }
        err.flush();
        out.flush();
        return !failed;
    }

    /**
     * @param args
     * @throws SAXException 
     */
    public static void main(String[] args) throws SAXException {
        boolean verbose = ((args.length == 1) && "-v".equals(args[0]));
        Driver d = new Driver(verbose);
        if (d.check()) {
            System.exit(0);
        } else {
            System.exit(-1);
        }
    }
}
