REPORTER ?= dot
DOC_PATH ?= ./docs

lib-cov:
	@rm -fr ./$@
	@jscoverage lib $@

test:
	@./node_modules/.bin/mocha --reporter $(REPORTER)

test-cov: lib-cov
	@mkdir -p $(DOC_PATH)
	@GENJI_COV=1 $(MAKE) test REPORTER=html-cov > $(DOC_PATH)/coverage.html

test-coveralls: lib-cov
	@GENJI_COV=1 $(MAKE) test REPORTER=mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js

watch:
	@./node_modules/.bin/mocha \
		--watch \
		--reporter $(REPORTER)

clean:
	rm -fr lib-cov
	rm -f coverage.html

docs: test-cov
	npm install beautiful-docs@0.8.0
	./node_modules/beautiful-docs/bin/bfdocs ./doc/manifest.json $(DOC_PATH)
	npm install plato@0.6.2
	./node_modules/plato/bin/plato -r -t "Genji Source Analysis"  -d $(DOC_PATH)/plato ./lib


.PHONY: test