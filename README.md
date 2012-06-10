#Plex JS
##What is it?
This project is a web based media player for the Plex system.

If you do not already know Plex, it's a media server/player system "done right"(tm). 
It supports pretty much every device you might think off.
The only thing that was missing was a web interface that you could take with you without installing anything.
Plex JS aims at taking care of this.

##Installation
To install Plex JS, you need to have a working Node.JS installation. Then it should only be a matter of cloning
the repository and starting the server.

To do so:
- Install Node.JS for you operating system and install it (http://nodejs.org/)
- Clone the repository (git clone git://github.com/jfremy/ReaderPlus.git) or download the latest version (https://github.com/jfremy/ReaderPlus/zipball/master)
- Start the server (once in the Plex JS directory, type "node src/server.js")
- Open the Plex JS interface in your browser (http://localhost:8000/public/index.html)

That's it. You should be good to go.

##Configuration
At the moment, there is not much that you can configure. Options are located in src/config.js.
Two parameters that are worth mentionning:
- options.server.port: you can change the port the server listens on (default: 8000)
- options.server.address: you can change the address the server binds to. Left empty, it will bind to all available interfaces. Set it to '127.0.0.1' to bind only to localhost (default: '')

That's it at the moments

##Credits
Thanks to the [Plex team](http://www.plexapp.com) for their awesome product and 
thanks to [Luke Lanchester](http://hybridlogic.co.uk/code/standalone/plex-export/) who let me use the page layout of his Plex-Export tool.