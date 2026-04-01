/*
Copyright (c) 2026 Sepio Corp. All Rights Reserved.

This software and its associated documentation files (the "Software") 
are the sole and exclusive property of Sepio Corp. Unauthorized copying, 
modification, distribution, or use of this Software is strictly prohibited.

Sepio Corp retains all intellectual property rights to this Software.
No license is granted to use, reproduce, or distribute this Software 
without the express written consent of Sepio Corp.

For inquiries regarding licensing, please contact:
Sepio Corp
Email: legal@sepiocorp.com
*/
(function () {
  var STORAGE_KEY = 'shikola_school_profile';

  function getProfile() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function saveProfile(profile) {
    if (!profile || typeof profile !== 'object') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      window.dispatchEvent(new CustomEvent('shikola:school-profile-updated', { detail: profile }));
    } catch (e) {}
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(reader.error || new Error('Unable to read file'));
      };
      reader.readAsDataURL(file);
    });
  }

  function applyProfileToDom(root) {
    try {
      var profile = getProfile();
      if (!profile) return;
      var scope = root || document;

      var logoEls = scope.querySelectorAll('[data-school-logo]');
      logoEls.forEach(function (img) {
        if (profile.logoDataUrl) {
          img.src = profile.logoDataUrl;
          img.onerror = function() {
            console.warn('Failed to load school logo, using fallback');
            img.src = '';
          };
        }
      });

      var mappings = [
        ['[data-school-name]', 'name'],
        ['[data-school-tagline]', 'tagline'],
        ['[data-school-phone]', 'phone'],
        ['[data-school-address]', 'address'],
        ['[data-school-website]', 'website'],
        ['[data-school-email]', 'email'],
        ['[data-school-headteacher]', 'headteacher']
      ];

      mappings.forEach(function (pair) {
        var selector = pair[0];
        var key = pair[1];
        if (!profile[key]) return;
        try {
          scope.querySelectorAll(selector).forEach(function (el) {
            if ('textContent' in el) {
              el.textContent = profile[key];
            }
          });
        } catch (e) {
          console.warn('Failed to apply profile data for', key, e);
        }
      });
    } catch (e) {
      console.error('Error applying school profile to DOM:', e);
    }
  }

  window.ShikolaSchoolProfile = {
    STORAGE_KEY: STORAGE_KEY,
    getProfile: getProfile,
    saveProfile: saveProfile,
    applyProfileToDom: applyProfileToDom,
    handleLogoInputChange: function (inputEl, callback) {
      if (!inputEl || !inputEl.files || !inputEl.files[0]) {
        return Promise.reject(new Error('No file selected'));
      }
      
      return fileToDataUrl(inputEl.files[0]).then(function (dataUrl) {
        if (!dataUrl) return null;
        var current = getProfile() || {};
        var next = Object.assign({}, current, { logoDataUrl: dataUrl });
        saveProfile(next);
        if (typeof callback === 'function') {
          try {
            callback(next);
          } catch (e) {
            console.warn('Callback error in handleLogoInputChange:', e);
          }
        }
        return next;
      }).catch(function (error) {
        console.error('Failed to process logo input:', error);
        return null;
      });
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    try {
      applyProfileToDom(document);
    } catch (e) {
      console.error('Failed to apply school profile on DOM load:', e);
    }
  });
})();
