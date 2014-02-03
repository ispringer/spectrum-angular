/*!
 * Spectrum Angular v0.9
 * https://github.com/ispringer/spectrum-angular
 *
 * Copyright 2014, Ian Springer
 * Released under the Apache License, version 2.0
 */

angular.module('spectrum', [])

.directive('spectrum', function($log, $window, $timeout) {
  var DEFAULT_OPTIONS = {
    preferredFormat: 'hex6',
    showInput: true,
    showAlpha: true,
    showButtons: false,
    clickoutFiresChange: true
  };

  function link(scope, element, attrs, ngModel) {
    var input = element.find('input');

    if (!isSpectrumAvailable(input)) {
      logError('spectrum not found - make sure spectrum.js is loaded.');
      return;
    }

    var options = initOptions(scope, attrs, ngModel);

    var initialized = false;
    if (options.flat) {
      // When the 'flat' option is true, spectrum cannot render itself correctly unless its parent element is visible,
      // so in that case, hold off on initializing spectrum until the first time its parent becomes visible.
      scope.init = function() {
        initialized = initFlatSpectrumIfParentVisible(element, ngModel, options);
        if (initialized) {
          scope.init = function() {
            return true;
          };
        }
        return initialized;
      }
    } else {
      initialized = true;
      initSpectrum(ngModel, input, options);
      scope.init = function() {
        return true;
      }
    }

    scope.$watch('ngModel', function(newValue, oldValue) {
      if (initialized) {
        updateViewValue(ngModel, input);
      }
    });
  }

  function isSpectrumAvailable(element) {
    try {
      var spectrumContainer = element.spectrum('container');
      return (spectrumContainer.length == 1);
    } catch (e) {
      return false;
    }
  }

  function logError() {
    return ($window.console.error || $window.console.log);
  }

  function initOptions(scope, attrs, ngModel) {
    var options = angular.copy(DEFAULT_OPTIONS);
    angular.extend(options, scope.$eval(attrs.options));

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
    element.spectrum('set', color);
  }

  function initFlatSpectrumIfParentVisible(element, ngModel, options) {
    if (element.parent().is(':visible')) {
      $timeout(function() {
        var input = element.find('input');
        initSpectrum(ngModel, input, options);
        setTimeout(function() {
          input.spectrum('reflow');
        }, 2000);
      });
      return true;
    } else {
      return false;
    }
  }

  function initSpectrum(ngModel, input, options) {
    options.color = ngModel.$viewValue || '';
    $log.info('Initializing spectrum with options:', options);
    input.spectrum(options);
  }

  return {
    restrict: 'EA',
    scope: {
      ngModel: '=',
      options: '@'
    },
    require: '?ngModel',
    replace: true,
    template: '<span ng-show="init()"><input></span>',
    link: link
  };
});
