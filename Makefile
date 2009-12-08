default:
	@echo 'make start - Start the game server'

start:
	plackup -s AnyEvent -a browgle.psgi
