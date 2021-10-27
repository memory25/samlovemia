const Brav1Toolbox = (function () {
  function addListener(element, type, listener, capture = false) {
    if (element.addEventListener) {
      element.addEventListener(type, listener, capture);
    }
    else if (element.attachEvent) {
      element.attachEvent(type, listener);
    }
  }

  function _testCSS(prop) {
    return _getPrefixed(prop) != '';
  }

  function _getPrefixed(prop) {
    for (let i = 0; i < prefixes.length; i++) {
      const pre = prefixes[i].replace(/-/g, '');
      let p = prop;
      if (pre.length > 0) {
        p = p.charAt(0).toUpperCase() + p.substr(1);
      }
      p = pre + p;
      if (p in s == true) {
        return p;
      }
    }

    return '';
  }

  function typeOf(value) {
    return !!value && Object.prototype.toString.call(value).match(/(\w+)\]/)[1];
  }

  function addClass(element, name) {
    if (element.classList) {
      element.classList.add(name);
    }
    else if (hasClass(element, name) == false) {
      let { className } = element;
      if (className.length > 0) {
        className += ' ';
      }
      element.className = className + name;
    }
  }

  function removeClass(elem, name) {
    if (elem.classList) {
      elem.classList.remove(name);
    }
    else {
      let { className } = elem;
      if (className.indexOf(name) != -1) {
        if (className.indexOf(' ' + name) != -1) {
          className = className.replace(' ' + name, '');
        }
        else if (className.indexOf(name + ' ') != -1) {
          className = className.replace(name + ' ', '');
        }
        else {
          className = className.replace(name, '');
        }
      }
      elem.className = className;
    }
  }

  function hasClass(target, name) {
    if (target) {
      if (target.classList) {
        return target.classList.contains(name);
      }
      if (target.className) {
        return target.className.indexOf(name) != -1;
      }
    }

    return false;
  }

  function _dispatchEvent(e, params) {
    if (document.createEvent) {
      const evt = document.createEvent('HTMLEvents');
      evt.initEvent(e, true, true);
      let i;
      for (i in params) {
        evt[i] = params[i];
      }
      document.dispatchEvent(evt);
    }
  }

  function distance(p, r) {
    let sum,
        v;
    sum = r.x - p.x;
    sum *= sum;
    v = r.y - p.y;
    v *= v;

    return Math.abs(Math.sqrt(sum + v));
  }
  var prefixes = [ '', '-webkit-', '-moz-', '-ms-', '-o-' ];
  let s;
  if (window.getComputedStyle) {
    s = window.getComputedStyle(document.body);
  }
  else {
    s = document.documentElement.style;
  }

  return {
    'addListener': addListener,
    'dispatchEvent': _dispatchEvent,
    'testCSS': _testCSS,
    'getPrefixed': _getPrefixed,
    'typeOf': typeOf,
    'addClass': addClass,
    'removeClass': removeClass,
    'hasClass': hasClass,
    'distance': distance,
  };
})();

const Flowtime = (function () {
  function onNavClick(e) {
    const match = e.target.getAttribute('href');
    if (match && match.substr(0, 1) == '#') {
      e.target.blur();
      e.preventDefault();
      const href = match;
      var dest = NavigationMatrix.setPage(href);
      navigateTo(dest, true, true);
    }
    if (isOverview) {
      dest = e.target;
      for (; dest && !Brav1Toolbox.hasClass(dest, PAGE_CLASS);) {
        dest = dest.parentNode;
      }
      if (Brav1Toolbox.hasClass(dest, PAGE_CLASS)) {
        e.preventDefault();
        navigateTo(dest, null, true);
      }
    }
    if (Brav1Toolbox.hasClass(e.target, PAGE_THUMB_CLASS)) {
      e.preventDefault();
      const pTo = Number(unsafeAttr(e.target.getAttribute('data-section')));
      const spTo = Number(unsafeAttr(e.target.getAttribute('data-page')));
      _gotoPage(pTo, spTo);
    }
  }

  function onPopState(event) {
    cvalue = false;
    let href;
    if (event.state) {
      href = event.state.token.replace('#/', '');
    }
    else {
      href = document.location.hash.replace('#/', '');
    }
    const route = NavigationMatrix.setPage(href);
    navigateTo(route, false);
  }

  function onHashChange(fn, value) {
    if (cvalue || value) {
      const h = document.location.hash.replace('#/', '');
      const dest = NavigationMatrix.setPage(h);
      navigateTo(dest, false);
    }
  }

  function onTouchStart(e) {
    _deltaX = 0;
    _deltaY = 0;
    e.preventDefault();
    e = getTouchEvent(e);
    _touchStartX = e.clientX;
    _touchStartY = e.clientY;
    aq = 1;
    const initOffset = getInitOffset();
    _ftX = initOffset.x;
    _ftY = initOffset.y;
  }

  function onTouchMove(e) {
    e.preventDefault();
    e = getTouchEvent(e);
    _deltaX = e.clientX - _touchStartX;
    _deltaY = e.clientY - _touchStartY;
  }

  function onTouchEnd(e) {
    e = getTouchEvent(e);
    aq = 0;
    _dragAxis = Math.abs(_deltaX) >= Math.abs(_deltaY) ? 'x' : 'y';
    if (_dragAxis == 'x' && Math.abs(_deltaX) >= _swipeLimit) {
      if (_deltaX > 0) {
        _prevSection();
      }
      else if (_deltaX < 0) {
        _nextSection();
      }
    }
    else if (_deltaY > 0 && Math.abs(_deltaY) >= _swipeLimit) {
      _prevPage();
    }
    else if (_deltaY < 0) {
      _nextPage();
    }
  }

  function getTouchEvent(e) {
    if (e.touches) {
      e = e.touches[0];
    }

    return e;
  }

  function getInitOffset() {
    const contents = ftContainer.style[Brav1Toolbox.getPrefixed('transform')];
    const i = contents.indexOf('translateX(') + 11;
    let l = contents.substring(i, contents.indexOf(')', i));
    if (l.indexOf('%') != -1) {
      l = l.replace('%', '');
      l = parseInt(l) / 100 * window.innerWidth;
    }
    else if (l.indexOf('px') != -1) {
      l = parseInt(l.replace('px', ''));
    }
    const idx = contents.indexOf('translateY(') + 11;
    let size = contents.substring(idx, contents.indexOf(')', idx));
    if (size.indexOf('%') != -1) {
      size = size.replace('%', '');
      size = parseInt(size) / 100 * window.innerHeight;
    }
    else if (size.indexOf('px') != -1) {
      size = parseInt(size.replace('px', ''));
    }

    return {
      'x': l,
      'y': size,
    };
  }

  function handler(event) {
    event.preventDefault();
    resetScroll();
  }

  function getElementByHash(h) {
    if (h.length > 0) {
      const aHash = h.replace('#/', '').split('/');
      const section = document.querySelector(SECTION_SELECTOR + '[data-id=__' + aHash[0] + ']') || document.querySelector(SECTION_SELECTOR + '[data-prog=__' + aHash[0] + ']');
      if (section != null) {
        let sp = null;
        if (aHash.length > 1) {
          sp = section.querySelector(PAGE_SELECTOR + '[data-id=__' + aHash[1] + ']') || section.querySelector(PAGE_SELECTOR + '[data-prog=__' + aHash[1] + ']');
        }
        if (sp == null) {
          sp = section.querySelector(PAGE_SELECTOR);
        }

        return sp;
      }
    }
  }

  function _updateNavigation() {
    NavigationMatrix.update();
    onHashChange(null, true);
  }

  function setTitle(type) {
    let title = pageTitle;
    const artist = NavigationMatrix.getCurrentPage().getAttribute('data-title');
    if (artist == null) {
      const sepor = type.split('/');
      let n = 0;
      for (; n < sepor.length; n++) {
        title += ' | ' + sepor[n];
      }
    }
    else {
      if (NavigationMatrix.getCurrentSection().getAttribute('data-title') != null) {
        title += ' | ' + NavigationMatrix.getCurrentSection().getAttribute('data-title');
      }
      title += ' | ' + artist;
    }
    document.title = title;
  }

  function getPageId(d) {
    return d.getAttribute('data-id') != null ? d.getAttribute('data-id').replace(/__/, '') : d.getAttribute('data-prog').replace(/__/, '');
  }

  function safeAttr(a) {
    if (a.substr(0, 2) != '__') {
      return '__' + a;
    }

    return a;
  }

  function unsafeAttr(a) {
    if (a.substr(0, 2) == '__') {
      return a.replace(/__/, '');
    }

    return a;
  }

  function navigateTo(dest, type, newPage) {
    type = type == false ? type : true;
    if (!dest) {
      if (NavigationMatrix.getCurrentPage() != null) {
        dest = NavigationMatrix.getCurrentPage();
      }
      else {
        dest = document.querySelector(PAGE_SELECTOR);
      }
      type = true;
    }
    navigate(dest);
    moveParallax(dest);
    if (isOverview) {
      _toggleOverview(false, false);
    }
    const h = NavigationMatrix.getHash(dest);
    if (newPage == true) {
      NavigationMatrix.updateFragments();
    }
    const pageIndex = NavigationMatrix.getPageIndex(dest);
    if (pastIndex.section != pageIndex.section || pastIndex.page != pageIndex.page) {
      if (pushHistory != null && type != false && NavigationMatrix.getCurrentFragmentIndex() == -1) {
        const data = {
          'token': h,
        };
        const nextHash = '#/' + h;
        currentHash = nextHash;
        window.history.pushState(data, null, currentHash);
      }
      else {
        document.location.hash = '/' + h;
      }
    }
    setTitle(h);
    fireNavigationEvent();
    pastIndex = pageIndex;
    NavigationMatrix.switchActivePage(dest, true);
    if (_showProgress) {
      updateProgress();
    }
  }

  function fireNavigationEvent() {
    const pageIndex = NavigationMatrix.getPageIndex();
    Brav1Toolbox.dispatchEvent(NAVIGATION_EVENT, {
      'section': NavigationMatrix.getCurrentSection(),
      'page': NavigationMatrix.getCurrentPage(),
      'sectionIndex': pageIndex.section,
      'pageIndex': pageIndex.page,
      'pastSectionIndex': pastIndex.section,
      'pastPageIndex': pastIndex.page,
      'prevSection': NavigationMatrix.hasPrevSection(),
      'nextSection': NavigationMatrix.hasNextSection(),
      'prevPage': NavigationMatrix.hasPrevPage(),
      'nextPage': NavigationMatrix.hasNextPage(),
      'fragment': NavigationMatrix.getCurrentFragment(),
      'fragmentIndex': NavigationMatrix.getCurrentFragmentIndex(),
      'isOverview': isOverview,
      'progress': NavigationMatrix.getProgress(),
      'total': NavigationMatrix.getPagesTotalLength(),
    });
  }

  function navigate(dest) {
    let x,
        y;
    const pageIndex = NavigationMatrix.getPageIndex(dest);
    if (seriesTimeString == true) {
      x = dest.x;
      y = dest.y;
    }
    else {
      x = pageIndex.section;
      y = pageIndex.page;
    }
    if (Brav1Toolbox.testCSS('transform')) {
      if (seriesTimeString) {
        ftContainer.style[Brav1Toolbox.getPrefixed('transform')] = 'translateX(' + -x + 'px) translateY(' + -y + 'px)';
      }
      else {
        ftContainer.style[Brav1Toolbox.getPrefixed('transform')] = 'translateX(' + -x * 100 + '%) translateY(' + -y * 100 + '%)';
      }
    }
    else if (seriesTimeString) {
      ftContainer.style.top = -y + 'px';
      ftContainer.style.left = -x + 'px';
    }
    else {
      ftContainer.style.top = -y * 100 + '%';
      ftContainer.style.left = -x * 100 + '%';
    }
    resetScroll();
  }

  function moveParallax(dest) {
    if (T) {
      const pageIndex = NavigationMatrix.getPageIndex(dest);
      const meshes = NavigationMatrix.getParallaxElements();
      let i = 0;
      for (; i < meshes.length; i++) {
        const m = meshes[i];
        if (m != undefined) {
          let ii = 0;
          for (; ii < m.length; ii++) {
            const b = m[ii];
            if (b != undefined) {
              let bi = 0;
              for (; bi < b.length; bi++) {
                const pxElement = b[bi];
                let pX = 0;
                let pY = 0;
                if (pageIndex.section < i) {
                  pX = pxElement.pX;
                }
                else if (pageIndex.section > i) {
                  pX = -pxElement.pX;
                }
                if (pageIndex.page < ii) {
                  pY = pxElement.pY;
                }
                else if (pageIndex.page > ii) {
                  pY = -pxElement.pY;
                }
                if ($buttons) {
                  pxElement.style[Brav1Toolbox.getPrefixed('transform')] = 'translateX(' + pX + 'px) translateY(' + pY + 'px)';
                }
                else {
                  pxElement.style[Brav1Toolbox.getPrefixed('transform')] = 'translateX(' + pX + '%) translateY(' + pY + '%)';
                }
              }
            }
          }
        }
      }
    }
  }

  function resetScroll() {
    window.scrollTo(0, 0);
  }

  function buildProgressIndicator() {
    const domFragment = document.createDocumentFragment();
    defaultProgress = document.createElement('div');
    defaultProgress.className = DEFAULT_PROGRESS_CLASS;
    domFragment.appendChild(defaultProgress);
    let i = 0;
    for (; i < NavigationMatrix.getSectionsLength(); i++) {
      const pDiv = document.createElement('div');
      pDiv.setAttribute('data-section', '__' + i);
      pDiv.className = SECTION_THUMB_CLASS;
      Brav1Toolbox.addClass(pDiv, 'thumb-section-' + i);
      const spArray = NavigationMatrix.getPages(i);
      let ii = 0;
      for (; ii < spArray.length; ii++) {
        const spDiv = document.createElement('div');
        spDiv.className = PAGE_THUMB_CLASS;
        spDiv.setAttribute('data-section', '__' + i);
        spDiv.setAttribute('data-page', '__' + ii);
        Brav1Toolbox.addClass(spDiv, 'thumb-page-' + ii);
        pDiv.appendChild(spDiv);
      }
      defaultProgress.appendChild(pDiv);
    }
    body.appendChild(defaultProgress);
  }

  function hideProgressIndicator() {
    if (defaultProgress != null) {
      body.removeChild(defaultProgress);
      defaultProgress = null;
    }
  }

  function updateProgress() {
    if (defaultProgress != null) {
      const spts = defaultProgress.querySelectorAll(PAGE_THUMB_SELECTOR);
      let i = 0;
      for (; i < spts.length; i++) {
        const spt = spts[i];
        const pTo = Number(unsafeAttr(spt.getAttribute('data-section')));
        const spTo = Number(unsafeAttr(spt.getAttribute('data-page')));
        if (pTo == NavigationMatrix.getPageIndex().section && spTo == NavigationMatrix.getPageIndex().page) {
          Brav1Toolbox.addClass(spts[i], 'actual');
        }
        else {
          Brav1Toolbox.removeClass(spts[i], 'actual');
        }
      }
    }
  }

  function _getDefaultProgress() {
    return defaultProgress;
  }

  function _toggleOverview(back, navigate) {
    if (isOverview) {
      zoomIn(back, navigate);
    }
    else {
      overviewCachedDest = NavigationMatrix.getCurrentPage();
      zoomOut();
    }
  }

  function zoomIn(direction, name) {
    isOverview = false;
    Brav1Toolbox.removeClass(body, 'ft-overview');
    NavigationMatrix.hideFragments();
    name = name !== false;
    if (name == true) {
      if (direction == true) {
        navigateTo(overviewCachedDest);
      }
      else {
        navigateTo();
      }
    }
  }

  function zoomOut() {
    isOverview = true;
    Brav1Toolbox.addClass(body, 'ft-overview');
    NavigationMatrix.showFragments();
    if (_useOverviewVariant == false) {
      overviewZoomTypeA(true);
    }
    else {
      overviewZoomTypeB(true);
    }
    fireNavigationEvent();
  }

  function overviewZoomTypeA(out) {
    if (out) {
      const minPxPerValUnit = 100 / NavigationMatrix.getSectionsLength();
      const dtStep = 100 / NavigationMatrix.getPagesLength();
      const bb = Math.min(minPxPerValUnit, dtStep) * 0.9;
      const e = (100 - NavigationMatrix.getSectionsLength() * bb) / 2;
      const bc = (100 - NavigationMatrix.getPagesLength() * bb) / 2;
      ftContainer.style[Brav1Toolbox.getPrefixed('transform')] = 'translate(' + e + '%, ' + bc + '%) scale(' + bb / 100 + ', ' + bb / 100 + ')';
    }
  }

  function overviewZoomTypeB(out) {
    if (out) {
      const scale = defaultScale;
      const pIndex = NavigationMatrix.getPageIndex();
      const e = 50 - scale * pIndex.section - scale / 2;
      const bb = 50 - scale * pIndex.page - scale / 2;
      ftContainer.style[Brav1Toolbox.getPrefixed('transform')] = 'translate(' + e + '%, ' + bb + '%) scale(' + scale / 100 + ', ' + scale / 100 + ')';
    }
  }

  function onKeyDown(event) {
    const tag = event.target.tagName;
    if (tag != 'INPUT' && tag != 'TEXTAREA' && tag != 'SELECT') {
      if (event.keyCode >= 37 && event.keyCode <= 40) {
        event.preventDefault();
      }
    }
  }

  function onKeyUp(e) {
    const tag = e.target.tagName;
    let a9;
    if (tag != 'INPUT' && tag != 'TEXTAREA' && tag != 'SELECT') {
      e.preventDefault();
      switch (e.keyCode) {
        case 27:
          _toggleOverview(true);
          break;
        case 33:
          //_gotoTop();
          break;
        case 34:
          //_gotoBottom();
          break;
        case 35:
          //_gotoEnd();
          break;
        case 36:
          //_gotoHome();
          break;
        case 37:
          //_prevSection(e.shiftKey);
          break;
        case 39:
          //_nextSection(e.shiftKey);
          break;
        case 38:
          _prevPage(e.shiftKey);
          break;
        case 40:
          _nextPage(e.shiftKey);
          break;
        case 13:
          if (isOverview) {
            _gotoPage(NavigationMatrix.getCurrentHilited());
          }
          break;
        default:
          break;
      }
    }
  }

  function _start() {
    if (_showProgress && defaultProgress == null) {
      buildProgressIndicator();
    }
    if (document.location.hash.length > 0) {
      Brav1Toolbox.addClass(ftContainer, 'no-transition');
      onHashChange(null, true);
      Brav1Toolbox.removeClass(ftContainer, 'no-transition');
    }
    else if (_start.arguments.length > 0) {
      _gotoPage.apply(this, _start.arguments);
    }
    else {
      _gotoPage(0, 0);
      updateProgress();
    }
  }

  function _nextSection(top) {
    const d = NavigationMatrix.getNextSection(top, _fragmentsOnSide, isOverview);
    if (d != undefined) {
      navigateTo(d);
    }
    else if (isOverview && _useOverviewVariant) {
      zoomOut();
    }
  }

  function _prevSection(top) {
    const d = NavigationMatrix.getPrevSection(top, _fragmentsOnSide, isOverview);
    if (d != undefined) {
      navigateTo(d);
    }
    else if (isOverview && _useOverviewVariant) {
      zoomOut();
    }
  }

  function _nextPage(jump) {
    const d = NavigationMatrix.getNextPage(jump, isOverview);
    if (d != undefined) {
      navigateTo(d);
    }
    else if (isOverview && _useOverviewVariant) {
      zoomOut();
    }
  }

  function _prevPage(jump) {
    const d = NavigationMatrix.getPrevPage(jump, isOverview);
    if (d != undefined) {
      navigateTo(d);
    }
    else if (isOverview && _useOverviewVariant) {
      zoomOut();
    }
  }

  function _gotoPage() {
    const args = _gotoPage.arguments;
    if (args.length > 0) {
      if (args.length == 1) {
        if (Brav1Toolbox.typeOf(args[0]) === 'Object') {
          const o = args[0];
          const p = o.section;
          const sp = o.page;
          if (p != null && p != undefined) {
            const objectNodeBox = document.querySelector(SECTION_SELECTOR + '[data-id=' + safeAttr(p) + ']');
            if (sp != null && sp != undefined) {
              var overviewCachedDest = objectNodeBox.querySelector(PAGE_SELECTOR + '[data-id=' + safeAttr(sp) + ']');
              if (overviewCachedDest != null) {
                navigateTo(overviewCachedDest);

                return;
              }
            }
          }
        }
        else if (args[0].nodeName != undefined) {
          navigateTo(args[0], null, true);
        }
      }
      if (Brav1Toolbox.typeOf(args[0]) === 'Number' || args[0] === 0) {
        overviewCachedDest = NavigationMatrix.getPageByIndex(args[1], args[0]);
        navigateTo(overviewCachedDest);
      }
    }
  }

  function _gotoHome() {
    _gotoPage(0, 0);
  }

  function _gotoEnd() {
    const sl = NavigationMatrix.getSectionsLength() - 1;
    _gotoPage(sl, NavigationMatrix.getPages(sl).length - 1);
  }

  function _gotoTop() {
    const pageIndex = NavigationMatrix.getPageIndex();
    _gotoPage(pageIndex.section, 0);
  }

  function _gotoBottom() {
    const pageIndex = NavigationMatrix.getPageIndex();
    _gotoPage(pageIndex.section, NavigationMatrix.getPages(pageIndex.section).length - 1);
  }

  function _addEventListener(type, handler, useCapture) {
    Brav1Toolbox.addListener(document, type, handler, useCapture);
  }

  function _setFragmentsOnSide(v) {
    _fragmentsOnSide = v;
    _setFragmentsOnBack(v);
  }

  function _setFragmentsOnBack(v) {
    _fragmentsOnBack = v;
  }

  function _setUseHistory(v) {
    pushHistory = v;
  }

  function _setSlideInPx(v) {
    seriesTimeString = v;
    navigateTo();
  }

  function _setSectionsSlideToTop(v) {
    _sectionsSlideToTop = v;
  }

  function _setGridNavigation(v) {
    _sectionsSlideToTop = !v;
  }

  function _setUseOverviewVariant(v) {
    _useOverviewVariant = v;
  }

  function al(src) {
    latestSrc = src;
  }

  function _setShowProgress(v) {
    _showProgress = v;
    if (_showProgress) {
      if (defaultProgress == null) {
        buildProgressIndicator();
      }
      updateProgress();
    }
    else if (defaultProgress != null) {
      hideProgressIndicator();
    }
  }

  function _setDefaultParallaxValues(x, y) {
    defaultParallaxX = x;
    defaultParallaxY = y == undefined ? defaultParallaxX : y;
    NavigationMatrix.update();
  }

  function clickWithWebdriver(selector) {
    $buttons = selector;
  }

  const isTouchScreen = 'ontouchstart' in document.documentElement;
  var pushHistory = window.history.pushState;
  const SECTION_CLASS = 'ft-section';
  var SECTION_SELECTOR = '.' + SECTION_CLASS;
  var PAGE_CLASS = 'ft-page';
  var PAGE_SELECTOR = '.' + PAGE_CLASS;
  const FRAGMENT_CLASS = 'ft-fragment';
  const FRAGMENT_SELECTOR = '.' + FRAGMENT_CLASS;
  const type = 'revealed';
  const status = 'actual';
  const elCls = 'revealed-temp';
  var DEFAULT_PROGRESS_CLASS = 'ft-default-progress';
  const DEFAULT_PROGRESS_SELECTOR = '.' + DEFAULT_PROGRESS_CLASS;
  var SECTION_THUMB_CLASS = 'ft-section-thumb';
  const SECTION_THUMB_SELECTOR = '.' + SECTION_THUMB_CLASS;
  var PAGE_THUMB_CLASS = 'ft-page-thumb';
  var PAGE_THUMB_SELECTOR = '.' + PAGE_THUMB_CLASS;
  var NAVIGATION_EVENT = 'flowtimenavigation';
  var ftContainer = document.querySelector('.flowtime');
  const element = document.querySelector('html');
  var body = document.querySelector('body');
  var cvalue = false;
  var currentHash = '';
  var pastIndex = {
    'section': 0,
    'page': 0,
  };
  var isOverview = false;
  var pageTitle = document.title;
  let overviewCachedDest;
  var defaultScale = 22;
  var defaultProgress = null;
  var _fragmentsOnSide = false;
  var _fragmentsOnBack = true;
  var seriesTimeString = false;
  var _sectionsSlideToTop = false;
  var _useOverviewVariant = false;
  var latestSrc = false;
  var _showProgress = false;
  var $buttons = false;
  var defaultParallaxX = 50;
  var defaultParallaxY = 50;
  var T = document.querySelector('.parallax') != null;
  let I = true;
  try {
    const htmlClass = document.querySelector('html').className.toLowerCase();
    if (htmlClass.indexOf('ie7') != -1 || htmlClass.indexOf('ie8') != -1 || htmlClass.indexOf('lt-ie9') != -1) {
      I = false;
    }
  }
  catch (aa) {
    I = false;
  }
  if (I) {
    Brav1Toolbox.addClass(body, 'ft-absolute-nav');
  }
  var NavigationMatrix = (function () {
    function _updateMatrix() {
      map = [];
      parallaxElements = [];
      fragments = document.querySelectorAll(FRAGMENT_SELECTOR);
      rows = [];
      sections = ftContainer.querySelectorAll('.flowtime > ' + SECTION_SELECTOR);
      pages = ftContainer.querySelectorAll('.flowtime ' + PAGE_SELECTOR);
      let i = 0;
      for (; i < sections.length; i++) {
        const pagesArray = [];
        const section = sections[i];
        rows[i] = [];
        cells[i] = [];
        if (section.getAttribute('data-id')) {
          section.setAttribute('data-id', '__' + unsafeAttr(section.getAttribute('data-id')));
        }
        section.setAttribute('data-prog', '__' + (i + 1));
        section.index = i;
        section.setAttribute('id', '');
        pages = section.querySelectorAll(PAGE_SELECTOR);
        pagesTotalLength += pages.length;
        pagesLength = Math.max(pagesLength, pages.length);
        let ii = 0;
        for (; ii < pages.length; ii++) {
          const _sp = pages[ii];
          if (_sp.getAttribute('data-id')) {
            _sp.setAttribute('data-id', '__' + unsafeAttr(_sp.getAttribute('data-id')));
          }
          _sp.setAttribute('data-prog', '__' + (ii + 1));
          _sp.index = ii;
          _sp.setAttribute('id', '');
          if (!_sp.getAttribute('data-title')) {
            const heading = _sp.querySelector('h1');
            if (heading != null && heading.textContent.lenght != '') {
              _sp.setAttribute('data-title', heading.textContent);
            }
          }
          setParallax(_sp, i, ii);
          pagesArray.push(_sp);
          const subFragments = _sp.querySelectorAll(FRAGMENT_SELECTOR);
          rows[i][ii] = subFragments;
          cells[i][ii] = -1;
        }
        map.push(pagesArray);
      }
      sectionsLength = sections.length;
      resetScroll();
      _updateOffsets();
    }

    function setParallax(page, sectionIndex, pageIndex) {
      if (T) {
        if (parallaxElements[sectionIndex] == undefined) {
          parallaxElements[sectionIndex] = [];
        }
        if (parallaxElements[sectionIndex][pageIndex] == undefined) {
          parallaxElements[sectionIndex][pageIndex] = [];
        }
        const forgottenTemplates = page.querySelectorAll('.parallax');
        if (forgottenTemplates.length > 0) {
          let i = 0;
          for (; i < forgottenTemplates.length; i++) {
            const el = forgottenTemplates[i];
            let pX = defaultParallaxX;
            let pY = defaultParallaxY;
            if (el.getAttribute('data-parallax') != null) {
              const pValues = el.getAttribute('data-parallax').split(',');
              pX = pY = pValues[0];
              if (pValues.length > 1) {
                pY = pValues[1];
              }
            }
            el.pX = pX;
            el.pY = pY;
            parallaxElements[sectionIndex][pageIndex].push(el);
          }
        }
      }
    }

    function _getParallaxElements() {
      return parallaxElements;
    }

    function _updateOffsets() {
      let i = 0;
      for (; i < pages.length; i++) {
        const _sp = pages[i];
        _sp.x = _sp.offsetLeft + _sp.parentNode.offsetLeft;
        _sp.y = _sp.offsetTop + _sp.parentNode.offsetTop;
      }
    }

    function _getNextSection(top, fos, io) {
      let result3 = x;
      const toTop = top == !_sectionsSlideToTop;
      if (fos == true && rows[i][x].length > 0 && cells[i][x] < rows[i][x].length - 1 && toTop != true && io == false) {
        min(i, x);
      }
      else {
        result3 = 0;
        if (toTop == true && i + 1 < map.length - 1) {
          result3 = 0;
        }
        else if (toTop != true || _fragmentsOnBack == true || i + 1 > map.length - 1) {
          result3 = x;
        }
        i = Math.min(i + 1, map.length - 1);

        return _getNearestPage(map[i], result3, io);
      }

      return hiliteOrNavigate(map[i][x], io);
    }

    function _getPrevSection(top, fos, io) {
      let result3 = x;
      const toTop = top == !_sectionsSlideToTop;
      if (fos == true && rows[i][x].length > 0 && cells[i][x] >= 0 && toTop != true && io == false) {
        set(i, x);
      }
      else {
        result3 = 0;
        result3 = 0;
        if (toTop == true && i - 1 >= 0) {
          result3 = 0;
        }
        else if (toTop != true || _fragmentsOnBack == true || i - 1 < 0) {
          result3 = x;
        }
        i = Math.max(i - 1, 0);

        return _getNearestPage(map[i], result3, io);
      }

      return hiliteOrNavigate(map[i][x], io);
    }

    function _getNearestPage(pg, sub, io) {
      let nsp = pg[sub];
      if (nsp == undefined) {
        let i = sub;
        for (; i >= 0; i--) {
          if (pg[i] != undefined) {
            nsp = pg[i];
            sub = i;
            break;
          }
        }
      }
      x = sub;
      if (!isOverview) {
        _updateFragments();
      }

      return hiliteOrNavigate(nsp, io);
    }

    function _getNextPage(jump, io) {
      if (rows[i][x].length > 0 && cells[i][x] < rows[i][x].length - 1 && jump != true && io == false) {
        min(i, x);
      }
      else if (map[i][x + 1] == undefined && map[i + 1] != undefined) {
        i += 1;
        x = 0;
      }
      else {
        x = Math.min(x + 1, map[i].length - 1);
      }

      return hiliteOrNavigate(map[i][x], io);
    }

    function _getPrevPage(jump, io) {
      if (rows[i][x].length > 0 && cells[i][x] >= 0 && jump != true && io == false) {
        set(i, x);
      }
      else if (x == 0 && map[i - 1] != undefined) {
        i -= 1;
        x = map[i].length - 1;
      }
      else {
        x = Math.max(x - 1, 0);
      }

      return hiliteOrNavigate(map[i][x], io);
    }

    function hiliteOrNavigate(d, io) {
      if (io == true) {
        _switchActivePage(d);
      }
      else {
        return d;
      }
    }

    function min(b, c, f) {
      if (f != undefined) {
        cells[b][c] = f;
      }
      else {
        f = cells[b][c] += 1;
      }
      let i = 0;
      for (; i <= f; i++) {
        Brav1Toolbox.addClass(rows[b][c][i], type);
        Brav1Toolbox.removeClass(rows[b][c][i], status);
      }
      Brav1Toolbox.addClass(rows[b][c][f], status);
    }

    function set(b, c, f) {
      if (f != undefined) {
        cells[b][c] = f;
      }
      else {
        f = cells[b][c];
      }
      let i = 0;
      for (; i < rows[b][c].length; i++) {
        if (i >= f) {
          Brav1Toolbox.removeClass(rows[b][c][i], type);
          Brav1Toolbox.removeClass(rows[b][c][i], elCls);
        }
        Brav1Toolbox.removeClass(rows[b][c][i], status);
      }
      f -= 1;
      if (f >= 0) {
        Brav1Toolbox.addClass(rows[b][c][f], status);
      }
      cells[b][c] = f;
    }

    function _showFragments() {
      let i = 0;
      for (; i < fragments.length; i++) {
        Brav1Toolbox.addClass(fragments[i], elCls);
      }
    }

    function _hideFragments() {
      let i = 0;
      for (; i < fragments.length; i++) {
        Brav1Toolbox.removeClass(fragments[i], elCls);
      }
    }

    function _updateFragments() {
      let n = 0;
      for (; n < rows.length; n++) {
        const r = rows[n];
        let i = 0;
        for (; i < r.length; i++) {
          const where = r[i];
          if (where.length > 0) {
            if (n > i) {
              var b = where.length - 1;
              for (; b >= 0; b--) {
                set(n, i, b);
              }
            }
            else if (n < i) {
              b = 0;
              for (; b < where.length; b++) {
                min(n, i, b);
              }
            }
            else if (n == i) {
              if (i > x) {
                b = where.length - 1;
                for (; b >= 0; b--) {
                  set(n, i, b);
                }
              }
              else if (i < x) {
                b = 0;
                for (; b < where.length; b++) {
                  min(n, i, b);
                }
              }
              else if (i == x) {
                if (_fragmentsOnBack == true && (pastIndex.section > NavigationMatrix.getPageIndex().section || pastIndex.page > NavigationMatrix.getPageIndex().page)) {
                  b = 0;
                  for (; b < where.length; b++) {
                    min(n, i, b);
                  }
                }
                else {
                  b = where.length - 1;
                  for (; b >= 0; b--) {
                    set(n, i, b);
                  }
                }
                if (_fragmentsOnBack == false) {
                  cells[n][i] = -1;
                }
                else if (pastIndex.section > NavigationMatrix.getPageIndex().section || pastIndex.page > NavigationMatrix.getPageIndex().page) {
                  cells[n][i] = where.length - 1;
                }
                else {
                  cells[n][i] = -1;
                }
              }
            }
          }
        }
      }
    }

    function getSection(state) {
      if (state) {
      }

      return i;
    }

    function _getPage(pageChanged) {
      if (pageChanged) {
      }

      return x;
    }

    function _getSections() {
      return sections;
    }

    function getPages(num) {
      return map[num];
    }

    function loadROM() {
      return pages;
    }

    function _getSectionsLength() {
      return sectionsLength;
    }

    function _getPagesLength() {
      return pagesLength;
    }

    function _getPagesTotalLength() {
      return pagesTotalLength;
    }

    function _getPageIndex(d) {
      let id = i;
      let p = x;
      if (d != undefined) {
        id = d.parentNode.index;
        p = d.index;
      }

      return {
        'section': id,
        'page': p,
      };
    }

    function _getSectionByIndex(i) {
      return sections[i];
    }

    function _getPageByIndex(i, pi) {
      return map[pi][i];
    }

    function _getCurrentSection() {
      return sections[i];
    }

    function _getCurrentPage() {
      return map[i][x];
    }

    function _getCurrentFragment() {
      return rows[i][x][_getCurrentFragmentIndex()];
    }

    function _getCurrentFragmentIndex() {
      return cells[i][x];
    }

    function _hasNextSection() {
      return i < sections.length - 1;
    }

    function _hasPrevSection() {
      return i > 0;
    }

    function hasNextPage() {
      return x < map[i].length - 1;
    }

    function _hasPrevPage() {
      return x > 0;
    }

    function _getProgress() {
      if (i == 0 && x == 0) {
        return 0;
      }

      let c = 0;
      let k = 0;
      for (; k < i; k++) {
        c += map[k].length;
      }
      c += map[i][x].index + 1;

      return c;
    }

    function _getHash(d) {
      if (d != undefined) {
        x = _getPageIndex(d).page;
        i = _getPageIndex(d).section;
      }
      let h = '';
      const _p = sections[i];
      h += getPageId(_p);
      if (map[i].length > 1) {
        const _sp = map[i][x];
        h += '/' + getPageId(_sp);
      }

      return h;
    }

    function _setPage(h) {
      const elem = getElementByHash(h);
      if (elem) {
        const c = elem.parentNode;
        let index = 0;
        for (; index < map.length; index++) {
          const array = map[index];
          if (sections[index] === c) {
            i = index;
            let j = 0;
            for (; j < array.length; j++) {
              if (array[j] === elem) {
                x = j;
                break;
              }
            }
          }
        }
        _updateFragments();
      }

      return elem;
    }

    function _switchActivePage(d, navigate) {
      const focusIndex = d.parentNode.index;
      let i = 0;
      for (; i < map.length; i++) {
        const pa = map[i];
        let ii = 0;
        for (; ii < pa.length; ii++) {
          const spa = pa[ii];
          Brav1Toolbox.removeClass(spa, 'past-section');
          Brav1Toolbox.removeClass(spa, 'future-section');
          Brav1Toolbox.removeClass(spa, 'past-page');
          Brav1Toolbox.removeClass(spa, 'future-page');
          if (spa !== d) {
            Brav1Toolbox.removeClass(spa, 'hilite');
            if (isOverview == false && spa !== _getCurrentPage()) {
              Brav1Toolbox.removeClass(spa, 'actual');
            }
            if (i < focusIndex) {
              Brav1Toolbox.addClass(spa, 'past-section');
            }
            else if (i > focusIndex) {
              Brav1Toolbox.addClass(spa, 'future-section');
            }
            if (spa.index < d.index) {
              Brav1Toolbox.addClass(spa, 'past-page');
            }
            else if (spa.index > d.index) {
              Brav1Toolbox.addClass(spa, 'future-page');
            }
          }
        }
      }
      Brav1Toolbox.addClass(d, 'hilite');
      if (navigate) {
        setActual(d);
      }

      hilited = d;
    }

    function _getCurrentHilited() {
      return hilited;
    }

    function setActual(d) {
      Brav1Toolbox.addClass(d, 'actual');
    }

    let sections,
        map,
        pages,
        fragments,
        rows;
    var cells = [];
    var parallaxElements = [];
    var sectionsLength = 0;
    var pagesLength = 0;
    var pagesTotalLength = 0;
    var i = 0;
    var x = 0;
    const bU = 0;
    const bj = 0;
    let hilited;
    _updateMatrix();

    return {
      'update': _updateMatrix,
      'updateFragments': _updateFragments,
      'showFragments': _showFragments,
      'hideFragments': _hideFragments,
      'getSection': getSection,
      'getPage': _getPage,
      'getSections': _getSections,
      'getPages': getPages,
      'getAllPages': loadROM,
      'getNextSection': _getNextSection,
      'getPrevSection': _getPrevSection,
      'getNextPage': _getNextPage,
      'getPrevPage': _getPrevPage,
      'getSectionsLength': _getSectionsLength,
      'getPagesLength': _getPagesLength,
      'getPagesTotalLength': _getPagesTotalLength,
      'getPageIndex': _getPageIndex,
      'getSectionByIndex': _getSectionByIndex,
      'getPageByIndex': _getPageByIndex,
      'getCurrentSection': _getCurrentSection,
      'getCurrentPage': _getCurrentPage,
      'getCurrentFragment': _getCurrentFragment,
      'getCurrentFragmentIndex': _getCurrentFragmentIndex,
      'getProgress': _getProgress,
      'getHash': _getHash,
      'setPage': _setPage,
      'switchActivePage': _switchActivePage,
      'getCurrentHilited': _getCurrentHilited,
      'hasNextSection': _hasNextSection,
      'hasPrevSection': _hasPrevSection,
      'hasNextPage': hasNextPage,
      'hasPrevPage': _hasPrevPage,
      'updateOffsets': _updateOffsets,
      'getParallaxElements': _getParallaxElements,
    };
  })();
  if (I) {
    if (isTouchScreen) {
      Brav1Toolbox.addListener(document, 'touchend', onNavClick, false);
    }
    else {
      Brav1Toolbox.addListener(document, 'click', onNavClick, false);
    }
  }
  if (cvalue == false && window.history.pushState) {
    window.onpopstate = onPopState;
  }
  else {
    cvalue = true;
  }
  Brav1Toolbox.addListener(window, 'hashchange', onHashChange);
  var _ftX = ftContainer.offsetX;
  var _ftY = 0;
  var _touchStartX = 0;
  var _touchStartY = 0;
  var _deltaX = 0;
  var _deltaY = 0;
  var aq = 0;
  var _dragAxis = 'x';
  var _swipeLimit = 100;
  element.addEventListener('touchstart', onTouchStart, false);
  element.addEventListener('touchmove', onTouchMove, false);
  element.addEventListener('touchend', onTouchEnd, false);
  const P = true;
  Brav1Toolbox.addListener(window, 'scroll', handler);
  const aR = (function _resizeMonitor() {
    function _enable() {
      _disable();
      if (!isOverview) {
        ticker = setTimeout(doResizeHandler, 300);
      }
    }

    function _disable() {
      clearTimeout(ticker);
    }

    function doResizeHandler() {
      NavigationMatrix.updateOffsets();
      navigateTo();
    }

    var ticker = NaN;
    Brav1Toolbox.addListener(window, 'resize', _enable);
    window.addEventListener('orientationchange', _enable, false);

    return {
      'enable': _enable,
      'disable': _disable,
    };
  })();

  defaultProgress = null;

  const aw = null;
  Brav1Toolbox.addListener(window, 'keydown', onKeyDown);
  Brav1Toolbox.addListener(window, 'keyup', onKeyUp);

  return {
    'start': _start,
    'updateNavigation': _updateNavigation,
    'nextSection': _nextSection,
    'prevSection': _prevSection,
    'next': _nextPage,
    'prev': _prevPage,
    'nextFragment': _nextPage,
    'prevFragment': _prevPage,
    'gotoPage': _gotoPage,
    'gotoHome': _gotoHome,
    'gotoTop': _gotoTop,
    'gotoBottom': _gotoBottom,
    'gotoEnd': _gotoEnd,
    'toggleOverview': _toggleOverview,
    'fragmentsOnSide': _setFragmentsOnSide,
    'fragmentsOnBack': _setFragmentsOnBack,
    'useHistory': _setUseHistory,
    'slideInPx': _setSlideInPx,
    'sectionsSlideToTop': _setSectionsSlideToTop,
    'gridNavigation': _setGridNavigation,
    'useOverviewVariant': _setUseOverviewVariant,
    'twoStepsSlide': al,
    'showProgress': _setShowProgress,
    'addEventListener': _addEventListener,
    'defaultParallaxValues': _setDefaultParallaxValues,
    'parallaxInPx': clickWithWebdriver,
    'getDefaultProgress': _getDefaultProgress,
  };
})();

(function (audiojs, audiojsInstance, container) {
  const path = (function () {
    const b = /audio(.min)?.js.*/;
    const a = document.getElementsByTagName('script');
    let j = 0;
    const startLen = a.length;
    for (; j < startLen; j++) {
      const e = a[j].getAttribute('src');
      if (b.test(e)) {
        return e.replace(b, '');
      }
    }
  })();
  container[audiojs] = {
    'instanceCount': 0,
    'instances': {},
    'flashSource': '      <object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" id="$1" width="1" height="1" name="$1" style="position: absolute; left: -1px;">         <param name="movie" value="$2?playerInstance=' + audiojs + '.instances[\'$1\']&datetime=$3">         <param name="allowscriptaccess" value="always">         <embed name="$1" src="$2?playerInstance=' + audiojs + '.instances[\'$1\']&datetime=$3" width="1" height="1" allowscriptaccess="always">       </object>',
    'settings': {
      'autoplay': false,
      'loop': false,
      'preload': true,
      'imageLocation': path + 'player-graphics.gif',
      'swfLocation': path + 'audiojs.swf',
      'useFlash': (function () {
        const doc = document.createElement('audio');

        return !(doc.canPlayType && doc.canPlayType('audio/mpeg;').replace(/no/, ''));
      })(),
      'hasFlash': (function () {
        if (navigator.plugins && navigator.plugins.length && navigator.plugins['Shockwave Flash']) {
          return true;
        }
        if (navigator.mimeTypes && navigator.mimeTypes.length) {
          const mimeType = navigator.mimeTypes['application/x-shockwave-flash'];

          return mimeType && mimeType.enabledPlugin;
        }
        try {
          new ActiveXObject('ShockwaveFlash.ShockwaveFlash');

          return true;
        }
        catch (a) {
        }


        return false;
      })(),
      'createPlayer': {
        'markup': '          <div class="play-pause">             <p class="play"></p>             <p class="pause"></p>             <p class="loading"></p>             <p class="error"></p>           </div>           <div class="scrubber">             <div class="progress"></div>             <div class="loaded"></div>           </div>           <div class="time">             <em class="played">00:00</em>/<strong class="duration">00:00</strong>           </div>           <div class="error-message"></div>',
        'playPauseClass': 'play-pause',
        'scrubberClass': 'scrubber',
        'progressClass': 'progress',
        'loaderClass': 'loaded',
        'timeClass': 'time',
        'durationClass': 'duration',
        'playedClass': 'played',
        'errorMessageClass': 'error-message',
        'playingClass': 'playing',
        'loadingClass': 'loading',
        'errorClass': 'error',
      },
      'css': '        .audiojs audio { position: absolute; left: -1px; }         .audiojs { width: 460px; height: 36px; background: #404040; overflow: hidden; font-family: monospace; font-size: 12px;           background-image: -webkit-gradient(linear, left top, left bottom, color-stop(0, #444), color-stop(0.5, #555), color-stop(0.51, #444), color-stop(1, #444));           background-image: -moz-linear-gradient(center top, #444 0%, #555 50%, #444 51%, #444 100%);           -webkit-box-shadow: 1px 1px 8px rgba(0, 0, 0, 0.3); -moz-box-shadow: 1px 1px 8px rgba(0, 0, 0, 0.3);           -o-box-shadow: 1px 1px 8px rgba(0, 0, 0, 0.3); box-shadow: 1px 1px 8px rgba(0, 0, 0, 0.3); }         .audiojs .play-pause { width: 25px; height: 40px; padding: 4px 6px; margin: 0px; float: left; overflow: hidden; border-right: 1px solid #000; }         .audiojs p { display: none; width: 25px; height: 40px; margin: 0px; cursor: pointer; }         .audiojs .play { display: block; }         .audiojs .scrubber { position: relative; float: left; width: 280px; background: #5a5a5a; height: 14px; margin: 10px; border-top: 1px solid #3f3f3f; border-left: 0px; border-bottom: 0px; overflow: hidden; }         .audiojs .progress { position: absolute; top: 0px; left: 0px; height: 14px; width: 0px; background: #ccc; z-index: 1;           background-image: -webkit-gradient(linear, left top, left bottom, color-stop(0, #ccc), color-stop(0.5, #ddd), color-stop(0.51, #ccc), color-stop(1, #ccc));           background-image: -moz-linear-gradient(center top, #ccc 0%, #ddd 50%, #ccc 51%, #ccc 100%); }         .audiojs .loaded { position: absolute; top: 0px; left: 0px; height: 14px; width: 0px; background: #000;           background-image: -webkit-gradient(linear, left top, left bottom, color-stop(0, #222), color-stop(0.5, #333), color-stop(0.51, #222), color-stop(1, #222));           background-image: -moz-linear-gradient(center top, #222 0%, #333 50%, #222 51%, #222 100%); }         .audiojs .time { float: left; height: 36px; line-height: 36px; margin: 0px 0px 0px 6px; padding: 0px 6px 0px 12px; border-left: 1px solid #000; color: #ddd; text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.5); }         .audiojs .time em { padding: 0px 2px 0px 0px; color: #f9f9f9; font-style: normal; }         .audiojs .time strong { padding: 0px 0px 0px 2px; font-weight: normal; }         .audiojs .error-message { float: left; display: none; margin: 0px 10px; height: 36px; width: 400px; overflow: hidden; line-height: 36px; white-space: nowrap; color: #fff;           text-overflow: ellipsis; -o-text-overflow: ellipsis; -icab-text-overflow: ellipsis; -khtml-text-overflow: ellipsis; -moz-text-overflow: ellipsis; -webkit-text-overflow: ellipsis; }         .audiojs .error-message a { color: #eee; text-decoration: none; padding-bottom: 1px; border-bottom: 1px solid #999; white-space: wrap; }                 .audiojs .play { background: url("$1") -2px -1px no-repeat; }         .audiojs .loading { background: url("$1") -2px -31px no-repeat; }         .audiojs .error { background: url("$1") -2px -61px no-repeat; }         .audiojs .pause { background: url("$1") -2px -91px no-repeat; }                 .playing .play, .playing .loading, .playing .error { display: none; }         .playing .pause { display: block; }                 .loading .play, .loading .pause, .loading .error { display: none; }         .loading .loading { display: block; }                 .error .time, .error .play, .error .pause, .error .scrubber, .error .loading { display: none; }         .error .error { display: block; }         .error .play-pause p { cursor: auto; }         .error .error-message { display: block; }',
      'trackEnded'() {
      },
      'flashError'() {
        const player = this.settings.createPlayer;
        const played = getByClass(player.errorMessageClass, this.wrapper);
        let currentTime = 'Missing <a href="http://get.adobe.com/flashplayer/">flash player</a> plugin.';
        if (this.mp3) {
          currentTime += ' <a href="' + this.mp3 + '">Download audio file</a>.';
        }
        container[audiojs].helpers.removeClass(this.wrapper, player.loadingClass);
        container[audiojs].helpers.addClass(this.wrapper, player.errorClass);
        played.innerHTML = currentTime;
      },
      'loadError'() {
        const player = this.settings.createPlayer;
        const played = getByClass(player.errorMessageClass, this.wrapper);
        container[audiojs].helpers.removeClass(this.wrapper, player.loadingClass);
        container[audiojs].helpers.addClass(this.wrapper, player.errorClass);
        played.innerHTML = 'Error loading: "' + this.mp3 + '"';
      },
      'init'() {
        container[audiojs].helpers.addClass(this.wrapper, this.settings.createPlayer.loadingClass);
      },
      'loadStarted'() {
        const player = this.settings.createPlayer;
        const played = getByClass(player.durationClass, this.wrapper);
        const curHour = Math.floor(this.duration / 60);
        const s = Math.floor(this.duration % 60);
        container[audiojs].helpers.removeClass(this.wrapper, player.loadingClass);
        played.innerHTML = (curHour < 10 ? '0' : '') + curHour + ':' + (s < 10 ? '0' : '') + s;
      },
      'loadProgress'(percent) {
        const player = this.settings.createPlayer;
        const scrubber = getByClass(player.scrubberClass, this.wrapper);
        getByClass(player.loaderClass, this.wrapper).style.width = scrubber.offsetWidth * percent + 'px';
      },
      'playPause'() {
        if (this.playing) {
          this.settings.play();
        }
        else {
          this.settings.pause();
        }
      },
      'play'() {
        container[audiojs].helpers.addClass(this.wrapper, this.settings.createPlayer.playingClass);
      },
      'pause'() {
        container[audiojs].helpers.removeClass(this.wrapper, this.settings.createPlayer.playingClass);
      },
      'updatePlayhead'(h) {
        let player = this.settings.createPlayer;
        let b = getByClass(player.scrubberClass, this.wrapper);
        getByClass(player.progressClass, this.wrapper).style.width = b.offsetWidth * h + 'px';
        player = getByClass(player.playedClass, this.wrapper);
        b = this.duration * h;
        h = Math.floor(b / 60);
        b = Math.floor(b % 60);
        player.innerHTML = (h < 10 ? '0' : '') + h + ':' + (b < 10 ? '0' : '') + b;
      },
    },
    'create'(options, data) {
      data = data || {};

      return options.length ? this.createAll(data, options) : this.newInstance(options, data);
    },
    'createAll'(options, elements) {
      const audioElements = elements || document.getElementsByTagName('audio');
      const instances = [];
      options = options || {};
      let i = 0;
      const ii = audioElements.length;
      for (; i < ii; i++) {
        instances.push(this.newInstance(audioElements[i], options));
      }

      return instances;
    },
    'newInstance'(element, options) {
      const s = this.helpers.clone(this.settings);
      const id = 'audiojs' + this.instanceCount;
      let audio = 'audiojs_wrapper' + this.instanceCount;
      this.instanceCount++;
      if (element.getAttribute('autoplay') != null) {
        s.autoplay = true;
      }
      if (element.getAttribute('loop') != null) {
        s.loop = true;
      }
      if (element.getAttribute('preload') == 'none') {
        s.preload = false;
      }
      if (options) {
        this.helpers.merge(s, options);
      }
      if (s.createPlayer.markup) {
        element = this.createPlayer(element, s.createPlayer, audio);
      }
      else {
        element.parentNode.setAttribute('id', audio);
      }
      audio = new container[audiojsInstance](element, s);
      if (s.css) {
        this.helpers.injectCss(audio, s.css);
      }
      if (s.useFlash && s.hasFlash) {
        this.injectFlash(audio, id);
        this.attachFlashEvents(audio.wrapper, audio);
      }
      else if (s.useFlash && !s.hasFlash) {
        this.settings.flashError.apply(audio);
      }
      if (!s.useFlash || s.useFlash && s.hasFlash) {
        this.attachEvents(audio.wrapper, audio);
      }

      return this.instances[id] = audio;
    },
    'createPlayer'(element, data, id) {
      let wrapper = document.createElement('div');
      let e = element.cloneNode(true);
      wrapper.setAttribute('class', 'audiojs');
      wrapper.setAttribute('className', 'audiojs');
      wrapper.setAttribute('id', id);
      if (e.outerHTML && !document.createElement('audio').canPlayType) {
        e = this.helpers.cloneHtml5Node(element);
        wrapper.innerHTML = data.markup;
        wrapper.appendChild(e);
        element.outerHTML = wrapper.outerHTML;
        wrapper = document.getElementById(id);
      }
      else {
        wrapper.appendChild(e);
        wrapper.innerHTML += data.markup;
        element.parentNode.replaceChild(wrapper, element);
      }

      return wrapper.getElementsByTagName('audio')[0];
    },
    'attachEvents'(wrapper, audio) {
      if (audio.settings.createPlayer) {
        const player = audio.settings.createPlayer;
        const playPause = getByClass(player.playPauseClass, wrapper);
        const scrubber = getByClass(player.scrubberClass, wrapper);
        container[audiojs].events.addListener(playPause, 'click', () => {
          audio.playPause.apply(audio);
        });
        container[audiojs].events.addListener(scrubber, 'click', function (x) {
          x = x.clientX;
          let pEl = this;
          let left = 0;
          if (pEl.offsetParent) {
            do {
              left += pEl.offsetLeft;
            } while (pEl = pEl.offsetParent);
          }
          audio.skipTo((x - left) / scrubber.offsetWidth);
        });
        if (!audio.settings.useFlash) {
          container[audiojs].events.trackLoadProgress(audio);
          container[audiojs].events.addListener(audio.element, 'timeupdate', () => {
            audio.updatePlayhead.apply(audio);
          });
          container[audiojs].events.addListener(audio.element, 'ended', () => {
            audio.trackEnded.apply(audio);
          });
          container[audiojs].events.addListener(audio.source, 'error', () => {
            clearInterval(audio.readyTimer);
            clearInterval(audio.loadTimer);
            audio.settings.loadError.apply(audio);
          });
        }
      }
    },
    'attachFlashEvents'(element, audio) {
      audio.swfReady = false;
      audio.load = function (mp3) {
        audio.mp3 = mp3;
        if (audio.swfReady) {
          audio.element.load(mp3);
        }
      };
      audio.loadProgress = function (percent, time) {
        audio.loadedPercent = percent;
        audio.duration = time;
        audio.settings.loadStarted.apply(audio);
        audio.settings.loadProgress.apply(audio, [ percent ]);
      };

      audio.skipTo = function (percent) {
        if (!(percent > audio.loadedPercent)) {
          audio.updatePlayhead.call(audio, [ percent ]);
          audio.element.skipTo(percent);
        }
      };

      audio.updatePlayhead = function (percent) {
        audio.settings.updatePlayhead.apply(audio, [ percent ]);
      };

      audio.play = function () {
        if (!audio.settings.preload) {
          audio.settings.preload = true;
          audio.element.init(audio.mp3);
        }
        audio.playing = true;
        audio.element.pplay();
        audio.settings.play.apply(audio);
      };

      audio.pause = function () {
        audio.playing = false;
        audio.element.ppause();
        audio.settings.pause.apply(audio);
      };

      audio.setVolume = function (value) {
        audio.element.setVolume(value);
      };

      audio.loadStarted = function () {
        audio.swfReady = true;
        if (audio.settings.preload) {
          audio.element.init(audio.mp3);
        }
        if (audio.settings.autoplay) {
          audio.play.apply(audio);
        }
      };
    },
    'injectFlash'(audio, id) {
      let flashSource = this.flashSource.replace(/\$1/g, id);
      flashSource = flashSource.replace(/\$2/g, audio.settings.swfLocation);
      flashSource = flashSource.replace(/\$3/g, +new Date() + Math.random());
      const html = audio.wrapper.innerHTML;
      const div = document.createElement('div');
      div.innerHTML = flashSource + html;
      audio.wrapper.innerHTML = div.innerHTML;
      audio.element = this.helpers.getSwf(id);
    },
    'helpers': {
      'merge'(from, to) {
        for (attr in to) {
          if (from.hasOwnProperty(attr) || to.hasOwnProperty(attr)) {
            from[attr] = to[attr];
          }
        }
      },
      'clone'(obj) {
        if (obj == null || typeof obj !== 'object') {
          return obj;
        }
        const rrs = new obj.constructor();
        let i;
        for (i in obj) {
          rrs[i] = arguments.callee(obj[i]);
        }

        return rrs;
      },
      'addClass'(node, value) {
        if (!RegExp('(\\s|^)' + value + '(\\s|$)').test(node.className)) {
          node.className += ' ' + value;
        }
      },
      'removeClass'(elem, value) {
        elem.className = elem.className.replace(RegExp('(\\s|^)' + value + '(\\s|$)'), ' ');
      },
      'injectCss'(audio, string) {
        let b = '';
        let c = document.getElementsByTagName('style');
        const name = string.replace(/\$1/g, audio.settings.imageLocation);
        let t = 0;
        let s = c.length;
        for (; t < s; t++) {
          const title = c[t].getAttribute('title');
          if (title && ~title.indexOf('audiojs')) {
            s = c[t];
            if (s.innerHTML === name) {
              return;
            }
            b = s.innerHTML;
            break;
          }
        }
        c = document.getElementsByTagName('head')[0];
        t = c.firstChild;
        s = document.createElement('style');
        if (c) {
          s.setAttribute('type', 'text/css');
          s.setAttribute('title', 'audiojs');
          if (s.styleSheet) {
            s.styleSheet.cssText = b + name;
          }
          else {
            s.appendChild(document.createTextNode(b + name));
          }
          if (t) {
            c.insertBefore(s, t);
          }
          else {
            c.appendChild(styleElement);
          }
        }
      },
      'cloneHtml5Node'(item) {
        const fragment = document.createDocumentFragment();
        let context = fragment.createElement ? fragment : document;
        context.createElement('audio');
        context = context.createElement('div');
        fragment.appendChild(context);
        context.innerHTML = item.outerHTML;

        return context.firstChild;
      },
      'getSwf'(name) {
        name = document[name] || window[name];

        return name.length > 1 ? name[name.length - 1] : name;
      },
    },
    'events': {
      'memoryLeaking': false,
      'listeners': [],
      'addListener'(element, type, listener) {
        if (element.addEventListener) {
          element.addEventListener(type, listener, false);
        }
        else if (element.attachEvent) {
          this.listeners.push(element);
          if (!this.memoryLeaking) {
            window.attachEvent('onunload', function () {
              if (this.listeners) {
                let i = 0;
                const { length } = this.listeners;
                for (; i < length; i++) {
                  container[audiojs].events.purge(this.listeners[i]);
                }
              }
            });
            this.memoryLeaking = true;
          }
          element.attachEvent('on' + type, () => {
            listener.call(element, window.event);
          });
        }
      },
      'trackLoadProgress'(audio) {
        if (audio.settings.preload) {
          let readyTimer,
              loadTimer;
          audio = audio;
          const d = (/(ipod|iphone|ipad)/i).test(navigator.userAgent);
          readyTimer = setInterval(() => {
            if (audio.element.readyState > -1) {
              if (!d) {
                audio.init.apply(audio);
              }
            }
            if (audio.element.readyState > 1) {
              if (audio.settings.autoplay) {
                audio.play.apply(audio);
              }
              clearInterval(readyTimer);
              loadTimer = setInterval(() => {
                audio.loadProgress.apply(audio);
                if (audio.loadedPercent >= 1) {
                  clearInterval(loadTimer);
                }
              });
            }
          }, 10);
          audio.readyTimer = readyTimer;
          audio.loadTimer = loadTimer;
        }
      },
      'purge'(res) {
        let a = res.attributes;
        let i;
        if (a) {
          i = 0;
          for (; i < a.length; i += 1) {
            if (typeof res[a[i].name] === 'function') {
              res[a[i].name] = null;
            }
          }
        }
        if (a = res.childNodes) {
          i = 0;
          for (; i < a.length; i += 1) {
            purge(res.childNodes[i]);
          }
        }
      },
      'ready': (function () {
        return function (fn) {
          const win = window;
          let c = false;
          let d = true;
          const doc = win.document;
          const root = doc.documentElement;
          const add = doc.addEventListener ? 'addEventListener' : 'attachEvent';
          const rem = doc.addEventListener ? 'removeEventListener' : 'detachEvent';
          const pre = doc.addEventListener ? '' : 'on';

          var init = function (e) {
            if (!(e.type == 'readystatechange' && doc.readyState != 'complete')) {
              (e.type == 'load' ? win : doc)[rem](pre + e.type, init, false);
              if (!c && (c = true)) {
                fn.call(win, e.type || e);
              }
            }
          };

          var poll = function () {
            try {
              root.doScroll('left');
            }
            catch (l) {
              setTimeout(poll, 50);

              return;
            }
            init('poll');
          };
          if (doc.readyState == 'complete') {
            fn.call(win, 'lazy');
          }
          else {
            if (doc.createEventObject && root.doScroll) {
              try {
                d = !win.frameElement;
              }
              catch (r) {
              }
              if (d) {
                poll();
              }
            }
            doc[add](pre + 'DOMContentLoaded', init, false);
            doc[add](pre + 'readystatechange', init, false);
            win[add](pre + 'load', init, false);
          }
        };
      })(),
    },
  };

  container[audiojsInstance] = function (element, s) {
    this.element = element;
    this.wrapper = element.parentNode;
    this.source = element.getElementsByTagName('source')[0] || element;
    this.mp3 = (function (item) {
      const source = item.getElementsByTagName('source')[0];

      return item.getAttribute('src') || (source ? source.getAttribute('src') : null);
    })(element);
    this.settings = s;
    this.loadStartedCalled = false;
    this.loadedPercent = 0;
    this.duration = 1;
    this.playing = false;
  };
  container[audiojsInstance].prototype = {
    'updatePlayhead'() {
      this.settings.updatePlayhead.apply(this, [ this.element.currentTime / this.duration ]);
    },
    'skipTo'(percent) {
      if (!(percent > this.loadedPercent)) {
        this.element.currentTime = this.duration * percent;
        this.updatePlayhead();
      }
    },
    'load'(mp3) {
      this.loadStartedCalled = false;
      this.source.setAttribute('src', mp3);
      this.element.load();
      this.mp3 = mp3;
      container[audiojs].events.trackLoadProgress(this);
    },
    'loadError'() {
      this.settings.loadError.apply(this);
    },
    'init'() {
      this.settings.init.apply(this);
    },
    'loadStarted'() {
      if (!this.element.duration) {
        return false;
      }
      this.duration = this.element.duration;
      this.updatePlayhead();
      this.settings.loadStarted.apply(this);
    },
    'loadProgress'() {
      if (this.element.buffered != null && this.element.buffered.length) {
        if (!this.loadStartedCalled) {
          this.loadStartedCalled = this.loadStarted();
        }
        this.loadedPercent = this.element.buffered.end(this.element.buffered.length - 1) / this.duration;
        this.settings.loadProgress.apply(this, [ this.loadedPercent ]);
      }
    },
    'playPause'() {
      if (this.playing) {
        this.pause();
      }
      else {
        this.play();
      }
    },
    'play'() {
      if ((/(ipod|iphone|ipad)/i).test(navigator.userAgent) && this.element.readyState == 0) {
        this.init.apply(this);
      }
      if (!this.settings.preload) {
        this.settings.preload = true;
        this.element.setAttribute('preload', 'auto');
        container[audiojs].events.trackLoadProgress(this);
      }
      this.playing = true;
      this.element.play();
      this.settings.play.apply(this);
    },
    'pause'() {
      this.playing = false;
      this.element.pause();
      this.settings.pause.apply(this);
    },
    'setVolume'(value) {
      this.element.volume = value;
    },
    'trackEnded'() {
      this.skipTo.apply(this, [ 0 ]);
      if (!this.settings.loop) {
        this.pause.apply(this);
      }
      this.settings.trackEnded.apply(this);
    },
  };

  var getByClass = function (className, element) {
    let children = [];
    element = element || document;
    if (element.getElementsByClassName) {
      children = element.getElementsByClassName(className);
    }
    else {
      let i,
          l;
      const items = element.getElementsByTagName('*');
      const r = RegExp('(^|\\s)' + className + '(\\s|$)');
      i = 0;
      l = items.length;
      for (; i < l; i++) {
        if (r.test(items[i].className)) {
          children.push(items[i]);
        }
      }
    }

    return children.length > 1 ? children : children[0];
  };
})('audiojs', 'audiojsInstance', this);
