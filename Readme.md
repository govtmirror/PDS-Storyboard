
# Install Node.js version 0.8 or above (stable version preferred)

### Mac

If you're using the excellent homebrew package manager, you can install node with one command: brew install node.
Otherwise, follow the below steps:
Install Xcode.
Install git.
Run the following commands:<br>
`git clone git://github.com/ry/node.git`<br>
`cd node`<br>
`./configure`<br>
`make`<br>
`sudo make install`

### Ubuntu

1.Install the dependencies:<br>
`sudo apt-get install g++ curl libssl-dev apache2-utils`<br>
`sudo apt-get install git-core`<br>
2.Run the following commands:<br>
`git clone git://github.com/ry/node.git`<br>
`cd node`<br>
`./configure`<br>
`make`<br>
`sudo make install`

NB: node version can be checked from terminal by <br>
`$ node -v`

use this link for further information: 
http://howtonode.org/how-to-install-nodejs


### Install Mongodb

The search functionality of the app requires `$text` operator from Mongo which is available for **version >= 2.6**. So you need to make sure you have version newer or equal than that.

`sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10`

`echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen'` | `sudo tee /etc/apt/sources.list.d/mongodb.list`

`sudo apt-get update`<br>
`sudo apt-get install mongodb-10gen`
use this link for further information:  
http://docs.mongodb.org/manual/tutorial/install-mongodb-on-ubuntu/

### Install MongoDB with Homebrew

Homebrew [1] installs binary packages based on published “formulae”. The following commands will update brew to the latest packages and install MongoDB.

In a terminal shell, use the following sequence of commands to update``brew`` to the latest packages and install MongoDB:<br>

`brew update`<br>
`brew install mongodb`<br>

use this link for further information: 
http://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/



### Install ImageMagick

`sudo apt-get install imagemagick`

### Install Ghostscript
The pin PDF functionality requires preview images to be created from PDF files. To achieve this the app uses Ghostscript which is widely available. If you do not have it install it like:

- Ubuntu: `sudo apt-get install ghostscript`
- OS X: `brew install ghostscript`

Then yiu will be able to pin PDFs from local files(uploads) or via web links.


### Download & extract myyna to your project folder.


### Provide read and write permission to config & uploads folder
It is mandatory, since we need to rewrite the config files & uploads directory.
### Open terminal, and navigate to project directory & Run
For example,<br>
`cd Projects/myyna`<br>
`node app`<br>

## Install Myyna

1.Navigate browser to  http://localhost:3000 to continue installation.
 
2.You will be asked to fill up an installation form., Follow the the installation instructions.

3.Please fill all the details like port you want to run the application, database credentials, database name, admin username, admin  password etc.

4.Be sure to provide the correct site url. If you are running on a local system, site url will be http://localhost:3000 or http://192.168.1.1:3000 , assuming your port is 3000 & local ip is 192.168.1.1. Or if you’ve configured a domain for your application, just give that url, for example, http://www.example.com

5.If you need support to host application on a domain, please feel free to contact our support team.

6.If you need to run the application in low level ports like, 100, 1000 then you must run the project as root.
sudo node app.js

7.After installation, You can optionally send a message to myyna team for support or feedbacks using the feedback form.

8.Then, go back to terminal and run the project again as we stopped it to change the configurations. You can either start normally using node app or, use nohup to avoid process exit on closing terminal.
nohup node app &

9. Visit your site url to see it in action 
eg:-http://localhost:3000 or http://example.com

### See your admin section

Myyna application includes an admin panel, to control your site.  Here you can manage users, admin users, site name & logo, meta descriptions, social connects and all. Admin section can be accessed by navigating to your siteurl/admin, with  username and password selected at the installation time.

eg: http://example.com/admin

### Generate Data

The install wizard provide option to setup sample data, but it is a small set data. If you need to generate more data then run the command in the project root folder. By default loginpage and role are not created when running the script in the command line.

````
node data_generator/populate-db-data.js
````

	command options:
	--reset: Drop all collections
	--loginpage: Create loginpage data
	--role: Create role data
	--configProperty=value: Overwrite the default configuration value

Without any option, the following configuration is used, using default values will be sufficient for development purpose. 

````
var dataConfig = {
  numUsers: 20,
  numCategories: 20,
  categoryPrefix: '',
  minBoards: 2, // 3 - 10 boards per category
  maxBoards: 10,
  boardPrefix: '',
  minPins: 2,   // 3 - 10 pins per board
  maxPins: 5,
  pinPrefix: '',
  minPinLikes: 1,
  maxPinLikes: 5,
  minRepins: 1,
  maxRepins: 3,
  imageWidth: 400,
  imageHeight: 400,
  imageFolder: '../uploads'
};
````

To change the default configuration value, please specify ```--configProperty=value```. For example to create 15 categories, run this command.

````
node data_generator/populate-db-data.js  --numCategories=15
````


The data generation log would look like this on successful execution : 

````
mongodb is connected
Created loginpages: 5
Created roles: 4
Creating users: ....................
Created users: 20
Creating user profiles: ....................
Create user profiles: 20
Creating categories: ....................
Created categories: 20
Creating user_roles for categories: ....................
Create user_roles for categories: 25
Creating boards: ............................
Created boards: 118
Creating user_roles for boards: ............................
Create user_roles for boards: 152
Creating pins: .................
Created pins: 420
Creating pin likes: ................
Created pin likes: 1262
Creating repin: .........
Created repins: 257
Created test data in database successfully
````

To get list of usernames navigate to the admin portal and view users. The password is `password` for all users. 

### Disqus integration setup
To use disqus with this application one needs to setup the required configurations via the admin area. There is section "Disqus" under the "Site Settings". Needed are:

- Disqus shortname - Tells the Disqus service your forum's shortname. So you need to setup new site in Disqus before you begin with this setup.
- Disqus API Secret Key - Your API Secret Key obtained from created application under [apps](https://disqus.com/api/applications/).
- Disqus API Public Key - Your API Public Key obtained from created application under [apps](https://disqus.com/api/applications/).

**Note** that for the Disqus's SSO to work you need SSO enabled account as described [here](https://help.disqus.com/customer/portal/articles/236206-integrating-single-sign-on). You should request such account for the SSO addon to work. Otherwise users will still be able to login via Disqus link at the left top dropdown but the Disqus itself won't note it and they will need to login via some of the Discus provided methods to post comments.

Then all should be working with the application comments.

You can see/manage them via Disqus's web interface or popup.

### Timeline
To view the timeline page, access http://localhost:3000/timeline.

To view the track activity sections on each page (except timeline page), click the clock icon at the top-right side of the page.

The page size of the timeline is configured in application/helpers/constants.js:

````
TIMELINE_PAGE_SIZE: 20
````

The following stories are supported:

User follow

User add

User remove

User update

Pin add

Pin comment

Pin like

Pin unlike

Pin repin

Pin delete

Board follow

Board create

Board delete

Category create

Category delete

### Generate pins from PPI
You can generate pins using a command line Node.JS utility that uses a web service to pull PPI products and insert them as pins in Myyna Web app.

The script is /pds\_generator/ppi\_generator/generate-pins-from-ppi.js
The configuration file is /pds\_generator/ppi\_generator/config.js

After the application is installed, please configure **user\_id** and **board\_id**.

Usage: node generate-pins-from-ppi --query=<QUERY>

Example usage: node generate-pins-from-ppi --query="TARGET_NAME:(Jupiter)+active:true&rows=1000"

Notice the query is between " and ".

Example output:


````
Datasource url: http://ppi.pds.nasa.gov/metadex/select?q=TARGET_NAME:(Jupiter)
mongodb is connected

Creating pin GOUP_0002

Pin url: http://ppi.pds.nasa.gov/

Creating pin PN_5001

Pin url: http://ppi.pds.nasa.gov/

Creating pin ULY_5101

Pin url: http://ppi.pds.nasa.gov/

Creating pin VGLE_1001

Pin url: http://ppi.pds.nasa.gov/

Creating pin VGLE_CRUISE

Pin url: http://ppi.pds.nasa.gov/

Creating pin VGPW_1101

Pin url: http://ppi.pds.nasa.gov/

Creating pin VG_1501

Pin url: http://ppi.pds.nasa.gov/

Creating pin VG_1502

Pin url: http://ppi.pds.nasa.gov/

Creating pin VGPW_0201

Pin url: http://ppi.pds.nasa.gov/

Creating pin GOMAG_5001

Pin url: http://ppi.pds.nasa.gov/

Created 10 pins from PPI products.
````

The script also saves stories for the created/updated pins. After the script is executed, refresh the timeline/activity box in Myyna app and see the new stories.

####More info on how to construct the query:

The query is a constraint on one or more facets. (Key:value)

Among the many facets you can constraint on the most useful are
TARGET\_NAME, SPACECRAFT\_NAME and INSTRUMENT\_ID. The format of a general
query string has the pattern:

TARGET\_NAME:({target}) AND SPACECRAFT_NAME:({spacecraft}) AND
INSTRUMENT\_ID:({instrument})

where {target}, {spacecraft} and {instrument} are replaced with common
values. You can use one or all of the phrases in query. For example, to
find all collections that have a {target} of "Jupiter" use a query string
of:

TARGET_NAME:(Jupiter)

To find all collections from the Galileo spacecraft use a query string of:

SPACECRAFT_NAME:(Galileo)

To find all collections from the Galileo spacecraft for the Jupiter
encounter use a query string of:

TARGET_NAME:(Jupiter) AND SPACECRAFT\_NAME:(Galileo)

To retrieve just the latest version of collections add "active:true" to the
query. For example, the Galileo+Jupiter query would become:

TARGET\_NAME:(Jupiter) AND SPACECRAFT\_NAME:(Galileo) AND active:true

An actual RESTful call would look like:

http://ppi.pds.nasa.gov/metadex/select/?q=SPACECRAFT\_NAME:(Galileo)+AND+active:true

By default a Solr query returns the first 10 entries. To control the number
of rows to return add the parameter "rows={number}" to the RESTful request.
For example to get the first 100 rows for the Galileo query do:

http://ppi.pds.nasa.gov/metadex/select/?q=SPACECRAFT\_NAME:(Galileo)+AND+active:true&rows=100


To start a list on a particular row add the parameter "start={number}" to
the RESTful request.

To get space craft name or target name or instrument ids, you can get it
from the website http://ppi.pds.nasa.gov/search/index.jsp open instruments
or target tabs, from drop down it will list all names you can use, you can
copy/paste it to your query and it should give you result back, usually the
result of search in website should match number of results you get from
your web service call.

### Search functionality

The search page can be accessed directly by navigating to http://localhost:3000/search or clicking the search icon which appears on every page except the search page.

On the search page, click inside the search input. A suggestion list should appear.

Choose a field. The field can be free text or can have a value suggestion list.

The search results should be updated each time a new tag is added or removed.

Some tabs have less search keys based on the type of entity that is searched.

## License

(The MIT License)

Copyright Cubet Techno Labs (c) 2013  <info@cubettech.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
