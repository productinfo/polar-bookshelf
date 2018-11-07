import {FilePaths} from "../../util/FilePaths";
import {Files} from "../../util/Files";
import {WebserverConfig} from './WebserverConfig';
import {FileRegistry} from './FileRegistry';
import {Webserver} from './Webserver';
import {Hashcodes} from '../../Hashcodes';
import {assertJSON} from '../../test/Assertions';
import {Http} from '../../util/Http';
import {assert} from 'chai';
import {ResourceRegistry} from './ResourceRegistry';
import {WebserverCerts} from './WebserverCerts';

describe('Webserver', function() {

    describe('create', function() {

        it("basic SSL", async function() {

            const webserverConfig = WebserverConfig.create(
                {
                    dir: "..",
                    port: 8085,
                    host: "127.0.0.1",
                    useSSL: true,
                    ssl: {
                        cert: WebserverCerts.CERT,
                        key: WebserverCerts.KEY,
                    }
                });
            const fileRegistry = new FileRegistry(webserverConfig);

            const webserver = new Webserver(webserverConfig, fileRegistry);
            webserver.start();
            webserver.stop();

        });


        it("basic", function() {

            const webserverConfig = new WebserverConfig("..", 8085);
            const fileRegistry = new FileRegistry(webserverConfig);

            const webserver = new Webserver(webserverConfig, fileRegistry);
            webserver.start();
            webserver.stop();

        });

        it("serving files", async function() {

            const webserverConfig = new WebserverConfig("..", 8095);
            const fileRegistry = new FileRegistry(webserverConfig);
            const webserver = new Webserver(webserverConfig, fileRegistry);

            webserver.start();

            const path = FilePaths.tmpfile('file-registry.html');
            await Files.writeFileAsync(path, 'hello world');

            const fileMeta = fileRegistry.register("0x000", path);

            assert.ok(fileMeta.url !== undefined);

            const buffer = await Files.readFileAsync(path);

            const hashcode = Hashcodes.create(buffer.toString('utf-8'));

            const expected = {
                "key": "0x000",
                "filename": path,
                "url": "http://127.0.0.1:8095/files/0x000"
            };

            assertJSON(fileMeta, expected);

            const response = await Http.execute(fileMeta.url);

            assertJSON(hashcode, Hashcodes.create(response.data.toString('utf8')));

            webserver.stop();

        });

        it("serving resources", async function() {

            const webserverConfig = new WebserverConfig("..", 8095);
            const fileRegistry = new FileRegistry(webserverConfig);
            const resourceRegistry = new ResourceRegistry();
            const webserver = new Webserver(webserverConfig, fileRegistry, resourceRegistry);

            webserver.start();

            const path = FilePaths.tmpfile('helloworld.html');
            await Files.writeFileAsync(path, 'hello world');

            resourceRegistry.register("/helloworld.html", path);

            const buffer = await Files.readFileAsync(path);

            const response = await Http.execute('http://localhost:8095/helloworld.html');

            assert.equal(response.response.headers['content-type'], 'text/html; charset=UTF-8');
            assert.equal('hello world', response.data.toString('utf8'));

            webserver.stop();

        });

    });




});

