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
import java.util.ArrayList;
import java.util.List;

import nu.validator.gnu.xml.aelfred2.SAXDriver;
import nu.validator.htmlparser.sax.HtmlParser;
import nu.validator.htmlparser.common.XmlViolationPolicy;
import nu.validator.localentities.LocalCacheEntityResolver;
import nu.validator.xml.dataattributes.DataAttributeDroppingSchemaWrapper;
import nu.validator.xml.langattributes.XmlLangAttributeDroppingSchemaWrapper;
import nu.validator.xml.roleattributes.RoleAttributeFilteringSchemaWrapper;
import nu.validator.xml.IdFilter;
import nu.validator.xml.NullEntityResolver;
import nu.validator.xml.SystemErrErrorHandler;
import nu.validator.xml.TypedInputSource;

import org.whattf.checker.NormalizationChecker;
import org.whattf.checker.TextContentChecker;
import org.whattf.checker.jing.CheckerSchema;
import org.whattf.checker.jing.CheckerValidator;
import org.whattf.checker.table.TableChecker;
import org.xml.sax.ErrorHandler;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;
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

    private LocalCacheEntityResolver entityResolver;

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

    private boolean hasHtml5Schema;

    private void setHasHtml5Schema() {
        this.hasHtml5Schema = true;
    }

    private boolean hasHtml5Schema() {
        return this.hasHtml5Schema;
    }

    private boolean failed = false;

    private boolean verbose;

    /**
     * @param basePath
     */
    public Driver(boolean verbose) {
        this.verbose = verbose;
        this.entityResolver = new LocalCacheEntityResolver(new NullEntityResolver());
        this.entityResolver.setAllowRnc(true);
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

    private Schema schemaByUrl(String schemaUrl) throws Exception {
        if ("http://s.validator.nu/html5/html5full-rdfa.rnc".equals(schemaUrl)) {
            System.setProperty("nu.validator.schema.rev-allowed", "1");
        } else {
            System.setProperty("nu.validator.schema.rev-allowed", "0");
        }
        PropertyMapBuilder pmb = new PropertyMapBuilder();
        pmb.put(ValidateProperty.ERROR_HANDLER, errorHandler);
        pmb.put(ValidateProperty.ENTITY_RESOLVER, entityResolver);
        pmb.put(ValidateProperty.XML_READER_CREATOR,
                new Jaxp11XMLReaderCreator());
        RngProperty.CHECK_ID_IDREF.add(pmb);
        PropertyMap jingPropertyMap = pmb.toPropertyMap();

        TypedInputSource schemaInput = (TypedInputSource) entityResolver.resolveEntity(
                null, schemaUrl);
        SchemaReader sr;
        if ("application/relax-ng-compact-syntax".equals(schemaInput.getType())) {
            sr = CompactSchemaReader.getInstance();
        } else {
            sr = new AutoSchemaReader();
        }
        return sr.createSchema(schemaInput, jingPropertyMap);
    }

    private void checkFile(File file, boolean asUTF8, boolean asXml)
            throws IOException, SAXException {
        validator.reset();
        InputSource is = new InputSource(new FileInputStream(file));
        is.setSystemId(file.toURI().toURL().toString());
        if (asUTF8) {
            is.setEncoding("UTF-8");
        }
        if (asXml) {
            xmlParser.parse(is);
        } else {
            htmlParser.parse(is);
        }
    }

    private void checkHtmlFile(File file) throws IOException, SAXException {
        if (!file.exists()) {
            if (verbose) {
                out.println(String.format("\"%s\": warning: File not found.",
                        file.toURI().toURL().toString()));
                out.flush();
            }
            return;
        }
        if (verbose) {
            out.println(file);
            out.flush();
        }
        if (isXhtml(file)) {
            checkFile(file, false, true);
        } else if (isHtml(file)) {
            checkFile(file, true, false);
        } else {
            if (verbose) {
                out.println(String.format(
                        "\"%s\": warning: File was not checked."
                                + " Files must have a .html, .xhtml, .htm,"
                                + " or .xht extension.",
                        file.toURI().toURL().toString()));
                out.flush();
            }
        }
    }

    private boolean isXhtml(File file) {
        String name = file.getName();
        return name.endsWith(".xhtml") || name.endsWith(".xht");
    }

    private boolean isHtml(File file) {
        String name = file.getName();
        return name.endsWith(".html") || name.endsWith(".htm");
    }

    private boolean isCheckableFile(File file) {
        return file.isFile() && (isHtml(file) || isXhtml(file));
    }

    private void recurseDirectory(File directory) throws SAXException,
            IOException {
        File[] files = directory.listFiles();
        for (int i = 0; i < files.length; i++) {
            File file = files[i];
            if (file.isDirectory()) {
                recurseDirectory(file);
            } else {
                checkHtmlFile(file);
            }
        }
    }

    private void checkFiles(List<File> files) {
        for (File file : files) {
            errorHandler.reset();
            try {
                if (file.isDirectory()) {
                    recurseDirectory(file);
                } else {
                    checkHtmlFile(file);
                }
            } catch (IOException e) {
            } catch (SAXException e) {
            }
            if (errorHandler.isInError()) {
                failed = true;
            }
        }
    }

    private void checkInvalidFiles(List<File> files) {
        for (File file : files) {
            countingErrorHandler.reset();
            try {
                if (file.isDirectory()) {
                    recurseDirectory(file);
                } else {
                    checkHtmlFile(file);
                }
            } catch (IOException e) {
            } catch (SAXException e) {
            }
            if (!countingErrorHandler.getHadErrorOrFatalError()) {
                failed = true;
                try {
                    err.println(String.format(
                            "\"%s\": error: Document was supposed to be"
                                    + " invalid but was not.",
                            file.toURI().toURL().toString()));
                    err.flush();
                } catch (MalformedURLException e) {
                    throw new RuntimeException(e);
                }
            }
        }
    }

    private enum State {
        EXPECTING_INVALID_FILES, EXPECTING_VALID_FILES, EXPECTING_ANYTHING
    }

    private void checkTestDirectoryAgainstSchema(File directory,
            String schemaUrl) throws SAXException, Exception {
        setUpSchema(schemaUrl);
        checkTestFiles(directory, State.EXPECTING_ANYTHING);
    }

    private void checkTestFiles(File directory, State state)
            throws SAXException {
        File[] files = directory.listFiles();
        List<File> validFiles = new ArrayList<File>();
        List<File> invalidFiles = new ArrayList<File>();
        if (files == null) {
            if (verbose) {
                try {
                    out.println(String.format(
                            "\"%s\": warning: No files found in directory.",
                            directory.toURI().toURL().toString()));
                    out.flush();
                } catch (MalformedURLException mue) {
                    throw new RuntimeException(mue);
                }
            }
            return;
        }
        for (int i = 0; i < files.length; i++) {
            File file = files[i];
            if (file.isDirectory()) {
                if (state != State.EXPECTING_ANYTHING) {
                    checkTestFiles(file, state);
                } else if ("invalid".equals(file.getName())) {
                    checkTestFiles(file, State.EXPECTING_INVALID_FILES);
                } else if ("valid".equals(file.getName())) {
                    checkTestFiles(file, State.EXPECTING_VALID_FILES);
                } else {
                    checkTestFiles(file, State.EXPECTING_ANYTHING);
                }
            } else if (isCheckableFile(file)) {
                if (state == State.EXPECTING_INVALID_FILES) {
                    invalidFiles.add(file);
                } else if (state == State.EXPECTING_VALID_FILES) {
                    validFiles.add(file);
                } else if (file.getPath().indexOf("notvalid") > 0) {
                    invalidFiles.add(file);
                } else {
                    validFiles.add(file);
                }
            }
        }
        if (validFiles.size() > 0) {
            setUpParser(errorHandler);
            checkFiles(validFiles);
        }
        if (invalidFiles.size() > 0) {
            setUpParser(countingErrorHandler);
            checkInvalidFiles(invalidFiles);
        }
    }

    private void setUpSchema(String schemaUrl) throws SAXException, Exception {
        mainSchema = schemaByUrl(schemaUrl);
        if (schemaUrl.contains("html5")) {
            try {
                assertionSchema = CheckerSchema.ASSERTION_SCH;
            } catch (Exception e) {
                errorHandler.fatalError(new SAXParseException(
                        "error: Reading schema failed. Terminating.", null));
                e.printStackTrace();
                System.exit(-1);
            }
            mainSchema = new DataAttributeDroppingSchemaWrapper(mainSchema);
            mainSchema = new XmlLangAttributeDroppingSchemaWrapper(mainSchema);
            mainSchema = new RoleAttributeFilteringSchemaWrapper(mainSchema);
            setHasHtml5Schema();
        }
    }

    /**
     * @throws SAXNotSupportedException 
     * @throws SAXdException 
     * 
     */
    private void setUpParser(ErrorHandler eh) throws SAXException {
        PropertyMapBuilder pmb = new PropertyMapBuilder();
        pmb.put(ValidateProperty.ERROR_HANDLER, eh);
        pmb.put(ValidateProperty.XML_READER_CREATOR,
                new Jaxp11XMLReaderCreator());
        RngProperty.CHECK_ID_IDREF.add(pmb);
        PropertyMap jingPropertyMap = pmb.toPropertyMap();

        validator = mainSchema.createValidator(jingPropertyMap);

        if (hasHtml5Schema()) {
            Validator assertionValidator = assertionSchema.createValidator(jingPropertyMap);
            validator = new CombineValidator(validator, assertionValidator);
            validator = new CombineValidator(validator, new CheckerValidator(
                    new TableChecker(), jingPropertyMap));
            validator = new CombineValidator(validator, new CheckerValidator(
                    new NormalizationChecker(), jingPropertyMap));
            validator = new CombineValidator(validator, new CheckerValidator(
                    new TextContentChecker(), jingPropertyMap));
        }

        htmlParser.setContentHandler(validator.getContentHandler());
        htmlParser.setErrorHandler(eh);
        htmlParser.setFeature("http://xml.org/sax/features/unicode-normalization-checking", true);
        xmlParser.setContentHandler(validator.getContentHandler());
        xmlParser.setErrorHandler(eh);
        xmlParser.setFeature("http://xml.org/sax/features/unicode-normalization-checking", true);
        htmlParser.setNamePolicy(XmlViolationPolicy.ALLOW);
        htmlParser.setMappingLangToXmlLang(true);
    }

    public boolean runTestSuite() throws SAXException, Exception {
        checkTestDirectoryAgainstSchema(new File(PATH
                + "html5core-plus-web-forms2/"),
                "http://s.validator.nu/html5/xhtml5core-plus-web-forms2.rnc");
        checkTestDirectoryAgainstSchema(new File(PATH + "html/"),
                "http://s.validator.nu/html5/html5full.rnc");
        checkTestDirectoryAgainstSchema(new File(PATH + "xhtml/"),
                "http://s.validator.nu/html5/xhtml5full-xhtml.rnc");
        checkTestDirectoryAgainstSchema(new File(PATH + "html-its/"),
                "http://s.validator.nu/html5/html5full-rdfa.rnc");
        checkTestDirectoryAgainstSchema(new File(PATH + "html-rdfa/"),
                "http://s.validator.nu/html5/html5full-rdfa.rnc");
        checkTestDirectoryAgainstSchema(new File(PATH + "html-rdfalite/"),
                "http://s.validator.nu/html5/html5full-rdfalite.rnc");

        if (verbose) {
            if (failed) {
                out.println("Failure!");
                out.flush();
            } else {
                out.println("Success!");
                out.flush();
            }
        }
        return !failed;
    }

    private boolean validateFilesAgainstSchema(List<File> files,
            String schemaUrl) throws SAXException, Exception {
        setUpSchema(schemaUrl);
        setUpParser(errorHandler);
        checkFiles(files);
        return !failed;
    }

    /**
     * @param args
     * @throws SAXException 
     */
    public static void main(String[] args) throws SAXException, Exception {
        boolean verbose = false;
        boolean hasFileArgs = false;
        int fileArgsStart = 0;
        for (int i = 0; i < args.length; i++) {
            if (!args[i].startsWith("-")) {
                hasFileArgs = true;
                fileArgsStart = i;
                break;
            } else {
                if ("-v".equals(args[i])) {
                    verbose = true;
                }
            }
        }
        if (hasFileArgs) {
            // java org.whattf.syntax.Driver OPTIONS FILENAMES
            // (validate one or more arbitrary documents)
            String schemaUrl = "http://s.validator.nu/html5/html5full-rdfa.rnc";
            List<File> files = new ArrayList<File>();
            for (int i = fileArgsStart; i < args.length; i++) {
                files.add(new File(args[i]));
            }
            Driver d = new Driver(verbose);
            if (d.validateFilesAgainstSchema(files, schemaUrl)) {
                System.exit(0);
            } else {
                System.exit(-1);
            }
        } else {
            verbose = ((args.length == 1) && "-v".equals(args[0]));
            // java org.whattf.syntax.Driver [-v]
            Driver d = new Driver(verbose);
            if (d.runTestSuite()) {
                System.exit(0);
            } else {
                System.exit(-1);
            }
        }
    }
}
