;(function(root, factory) {
  factory(
    root.MxWcTool,
    root.MxWcIcon,
    root.MxWcI18N,
    root.MxWcExtApi,
    root.MxWcExtMsg,
    root.MxWcStorage,
    root.MxWcConfig,
    root.MxWcLink
  );

})(this, function(T, MxWcIcon, I18N, ExtApi, ExtMsg,
    MxWcStorage, MxWcConfig, MxWcLink, undefined) {
  "use strict";
  const state = {};

  function menuClick(e){
    const menu = e.target;
    switch(menu.getAttribute('data-id')){
      case 'clip': startClip(); break;
      case 'history': jumpToPage('extPage.history'); break;
      case 'setting': jumpToPage('extPage.setting'); break;
      case 'home'   : jumpToPage('extPage.home'); break;
      case 'last-result':viewLastResult(); break;
      default: break;
    }
  }

  function closeWindow(){ window.close() }

  // can't do user action in promise, lead to (xxx may only be called from a user input handler)
  function viewLastResult(){
    const {url, downloadItemId, failedTaskNum} = state.lastClippingResult;
    if(failedTaskNum > 0) {
      jumpToPage('extPage.last-clipping-result');
      return;
    }
    if(downloadItemId) {
      // clipping saved by browser download.
      MxWcStorage.set('lastClippingResult', null);
      state.lastClippingResult = null;
      ExtApi.openDownloadItem(downloadItemId);
    } else {
      if(url.startsWith('http') || state.allowFileUrlAccess) {
        MxWcStorage.set('lastClippingResult', null);
        state.lastClippingResult = null;
        ExtApi.createTab(url);
      } else {
        // We can't open file url without allowed.
        jumpToPage('extPage.last-clipping-result');
      }
    }
    closeWindow();
  }

  function startClip(){
    ExtMsg.sendToContent({type: 'icon.click'}).then(closeWindow);
  }

  function jumpToPage(page){
    ExtApi.createTab(MxWcLink.get(page));
    closeWindow();
  }

  async function renderMenus(){
    const tab = await ExtApi.getCurrentTab();
    const tabUrl = tab.url;
    const pageIds = ['history', 'setting'];
    let menuIds = [];

    if(T.isFileUrl(tabUrl) ||
       T.isExtensionUrl(tabUrl) ||
       T.isBrowserUrl(tabUrl)){
      pageIds.forEach(function(pageId){
        const extPagePath = MxWcLink.getExtensionPagePath(pageId);
        if(tabUrl.indexOf(extPagePath) == -1){
          menuIds.push(pageId);
        }
      })
    }else{
      //browser restricted url
      if(['addons.mozilla.org', 'chrome.google.com'].indexOf((new URL(tabUrl)).host) > -1) {
        menuIds = pageIds;
      } else {
        menuIds = ['clip'].concat(pageIds);
      }
    }
    menuIds.push('home');

    const config = await MxWcConfig.load();
    const allowFileSchemeAccess = await ExtApi.isAllowedFileSchemeAccess();
    const lastClippingResult = await MxWcStorage.get('lastClippingResult');
    state.allowFileUrlAccess = (allowFileSchemeAccess || config.allowFileSchemeAccess);
    state.config = config;


    if(lastClippingResult){
      // Browser will erase download records when user restart it.
      if (lastClippingResult.downloadItemId) {
        const downloadItem = await ExtApi.findDownloadItem(lastClippingResult.downloadItemId);
        if (downloadItem) {
          state.lastClippingResult = lastClippingResult;
          menuIds.unshift('last-result');
        } else {
          MxWcStorage.set('lastClippingResult', null);
        }
      } else {
        state.lastClippingResult = lastClippingResult;
        menuIds.unshift('last-result');
      }
    }
    const template = T.findElem('menu-tpl').innerHTML;

    const icons = {
      "last-result" : '&#9745;',
      "clip"        : '&#9984;',
      "history"     : '&#9780;',
      "setting"     : '&#9965;',
      "home"        : '&#9961;',
    }
    // 9745 ☑
    // 9215 ⏿
    // 9984 ✀
    // 9780 ☴
    // 9776 ☰
    // 9965 ⛭
    // 9961 ⛩

    let html = "";
    menuIds.forEach(function(menuId){
      const appendClass = (menuId == 'last-result' ? ' active' : '');
      html += T.renderTemplate(template, {
        icon: icons[menuId],
        iconAppendClass: appendClass,
        menuId: menuId,
        menuContent: I18N.t("popup.menu." + menuId),
      });
    });
    T.setHtml('.menus', html);
    bindListener();

  }

  function bindListener(){
    const menus = document.querySelectorAll(".menu");
    menus.forEach(function(menu){
      T.bindOnce(menu, 'click', menuClick);
    });
  }


  async function init(){
    await renderMenus();
    ExtMsg.initPage('popup');
    MxWcIcon.change("default");
  }

  document.addEventListener("DOMContentLoaded", init);

});
