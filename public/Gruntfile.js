module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/* packaged at <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      dist: {
        src: ['js/app.js', 'js/services.js', 'js/controllers.js', 'js/directives.js', 'js/filters.js'],
        dest: 'application.js'
      },
      angular: {
        src: 'lib/jquery.min.js',
        dest: 'jquery.min.js'
      },
      lib: {
        src: ['lib/binaryajax.js', 'lib/exif.js', 'lib/md5.js'],
        dest: 'lib.min.js'
      }
    },
    cssmin: {
      combine: {
        files: {
          'application.css': ['css/flat-ui.css', 'css/app.css']
        }
      },
      bootstrap: {
        files: {
          'bootstrap/css/bootstrap.min.css': ['bootstrap/css/bootstrap.css']
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.registerTask('default', ['uglify', 'cssmin']);
};