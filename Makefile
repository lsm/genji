REPORTER ?= dot
DOC_PATH ?= ./docs

test-cov: lib-cov
	@GENJI_COV=1 $(MAKE) test REPORTER=html-cov > $(DOC_PATH)/coverage.html

lib-cov:
	@rm -fr ./$@
	@jscoverage lib $@

test:
	@./node_modules/.bin/mocha \
		--reporter $(REPORTER)

watch:
	@./node_modules/.bin/mocha \
		--watch \
		--reporter $(REPORTER)

clean:
	rm -fr lib-cov
	rm -f coverage.html

docs: test-cov
	@bfdocs ./doc/manifest.json $(DOC_PATH)
	plato -r -t "Genji Source Analysis"  -d $(DOC_PATH)/plato ./lib

.PHONY: test