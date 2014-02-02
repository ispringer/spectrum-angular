/*!
 * Spectrum Angular v1.0
 * https://github.com/ispringer/spectrum-angular
 *
 * Copyright 2014, Ian Springer
 * Released under the Apache License, version 2.0
 */

angular.module('spectrum', [])

  .factory('$spectrumHelper', function($window, $log) {
    function initOptions(scope, element, attrs, ngModel, defaultOptions) {
      var options = angular.extend(defaultOptions, scope.$eval(attrs.options));

      if (!options.change) {
        options.change = function(tinyColor) {
          updateModelValue(scope, ngModel, tinyColor);
        }
      }

      if (!options.move && !options.showButtons) {
        options.move = function(tinyColor) {
          updateModelValue(scope, ngModel, tinyColor);
        };
      }

      return options;
    }

    function updateModelValue(scope, controller, tinyColor) {
      scope.$apply(function() {
        var color = tinyColor.toString();
        $log.info('Setting $scope.color to [' + color + ']...');
        controller.$setViewValue(color);
      });
    }

    function updateViewValue(controller, element) {
      var color = controller.$viewValue || '';
      $log.info('Setting spectrum color to [' + color + ']...');
      if (isSpectrumInitialized(element)) {
        element.spectrum('set', color);
      }
    }

    function isSpectrumInitialized(element) {
       return (element.spectrum('container').filter('.sp-container').length == 1);
    }

    return {
      initOptions: initOptions,
      
      updateViewValue: updateViewValue,
      
      isSpectrumInitialized: isSpectrumInitialized,
      
      logError: ($window.console.error || $window.console.log)
    };
  })

  .directive('spectrum', function($spectrumHelper, $log) {
    function link(scope, element, attrs, ngModel) {
      var defaultOptions = {
        clickoutFiresChange: true,
        preferredFormat: 'hex6',
        showButtons: false,
        showAlpha: true,
      };
      
      var options = 
        $spectrumHelper.initOptions(scope, element, attrs, ngModel, defaultOptions);
     
      if (options.flat) {
        $spectrumHelper.logError('Use spectrum-flat directive, rather than spectrum directive.');
        return;
      }
      
      $log.info('Initializing spectrum with options:', options);
      element.spectrum(options);
      
      scope.$watch('ngModel', function(newVal) {
        $spectrumHelper.updateViewValue(ngModel, element);
      });
    }

    return {
      restrict: 'A',
      scope: {
        ngModel: '=',
        options: '@'
      },
      require: '?ngModel',
      link: link
    };
  })

  .directive('spectrumFlat', function($spectrumHelper, $log, $timeout) {
    function link(scope, element, attrs, ngModel) {
      var span = element.find('span');
      
      var defaultOptions = {
        flat: true,
        showInput: true,
        clickoutFiresChange: true,
        preferredFormat: 'hex6',
        showButtons: false,
        showAlpha: true
      };
      
      var options = 
        $spectrumHelper.initOptions(scope, span, attrs, ngModel, defaultOptions);

      if (!options.flat) {
        $spectrumHelper.logError('Use spectrum directive, rather than spectrum-flat directive.');
        return;
      }

      // When the 'flat' option is true, spectrum cannot render itself correctly unless its parent element is visible,
      // so in that case, hold off on initializing spectrum until the first time its parent becomes visible.        
      scope.init = function() {
        var initialized = $spectrumHelper.isSpectrumInitialized(span);
        if (!initialized && element.parent().is(':visible')) {
          initialized = true;
          $timeout(function() {                        
            options.color = ngModel.$viewValue || '';
            $log.info('Initializing spectrum with options:', options);
            span.spectrum(options);
            setTimeout(function() {
              span.spectrum('reflow');
            }, 2500);
          });
        }
        return initialized;
      };
      
      scope.$watch('ngModel', function(newVal) {
        $spectrumHelper.updateViewValue(ngModel, span);
      });
    }

    return {
      restrict: 'E',
      require: '?ngModel',
      scope: {
        ngModel: '=',
        options: '@'
      },
      replace: true,
      template: '<div ng-show="init()"><span></span></div>',
      link: link
    };

  });
