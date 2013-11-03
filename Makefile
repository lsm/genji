REPORTER ?= dot
DOC_PATH ?= ./docs

lib-cov:
	@rm -rf ./lib-cov
	@./node_modules/jscoverage/bin/jscoverage ./lib ./lib-cov

test:	
	@./node_modules/.bin/mocha --reporter $(REPORTER)

test-cov: lib-cov
	@mkdir -p $(DOC_PATH)
	GENJI_COV=1 $(MAKE) test REPORTER=html-cov > $(DOC_PATH)/coverage.html
	@rm -rf ./lib-cov

test-coveralls: lib-cov
	@echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	GENJI_COV=1 $(MAKE) test REPORTER=mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js
	@rm -rf ./lib-cov

watch:
	@./node_modules/.bin/mocha \
		--watch \
		--reporter $(REPORTER)

docs: test-cov
	npm install beautiful-docs@0.8.0
	./node_modules/beautiful-docs/bin/bfdocs ./doc/manifest.json $(DOC_PATH)
	npm install plato@0.6.2
	./node_modules/plato/bin/plato -r -t "Genji Source Analysis"  -d $(DOC_PATH)/plato ./lib


.PHONY: test