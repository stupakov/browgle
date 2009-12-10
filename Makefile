.PHONY: all clean

default:
	@echo "Commands:"
	@echo
	@echo "  make all - Setup Browgle"
	@echo "  make start - Run Browgle"
	@echo "  make clean - Remove extrra files"
	@echo
	

all: dict

dict: TWL06.txt
	mv $< $@

TWL06.txt: twl06.zip
	unzip $<
	touch $@

twl06.zip:
	wget 'http://www.isc.ro/lists/twl06.zip'

start:
	./browgle

clean:
	rm -f dict twl06.zip
