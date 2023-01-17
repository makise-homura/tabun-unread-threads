// ==UserScript==
// @name         Непрочитанные посты на Табуне
// @version      0.0.1
// @author       makise_homura
// @match        https://tabun.everypony.ru/*
// @grant        none
// ==/UserScript==

const loadingpic = '//cdn.everypony.ru/storage/06/08/97/2023/01/17/5f0aa790d5.gif';
const nopostspic = '//cdn.everypony.ru/storage/06/08/97/2023/01/17/315b1451fa.gif';

(() =>
{
  const navPillsNode = document.querySelector('.nav-pills-profile');
  if (!navPillsNode) return;

  const username = document.querySelector('.username').text;
  if (!window.location.href.includes('/profile/' + username + '/created')) return;

  const navItemNode = document.createElement('li');
  const navAnchorNode = document.createElement('a');
  navAnchorNode.setAttribute('href', '/profile/' + username + '/created/topics/?unread-posts');
  navAnchorNode.innerHTML = 'С новыми комментариями';
  navItemNode.appendChild(navAnchorNode);
  navPillsNode.insertBefore(navItemNode, navPillsNode.childNodes[2]);

  if (!window.location.href.includes('unread-posts')) return;

  const lastPageRef = document.querySelector('.pagination ul:last-of-type li:last-of-type a').href.match('page[0-9]+');
  if (lastPageRef.length != 1) return;
  const lastPage = ~~lastPageRef[0].replace('page','');

  const activeNavItemNode = document.querySelector('.nav-pills li.active');
  if (activeNavItemNode) activeNavItemNode.classList.remove('active');
  navItemNode.classList.add('active');

  document.querySelector('.pagination').hidden = true;

  const articleNode = document.querySelector('#content-wrapper #content');
  articleNode.querySelectorAll('article').forEach((e) => {e.parentNode.removeChild(e);});
  const loadingNode = document.createElement('div');
  loadingNode.innerHTML = '<img src="' + loadingpic + '" /> &mdash; Загрузка страниц (всего ' + lastPage + ')...';
  articleNode.appendChild(loadingNode);

  var loadedPages = 0;
  var docFragment = document.createDocumentFragment();
  for (curPage = 1; curPage <= lastPage; curPage++)
  {
    fetch('https://tabun.everypony.ru/profile/' + username + '/created/topics/page' + curPage)
    .then((r) =>
    {
      return r.text();
    })
    .then((t) => 
    {
      let domParser = new DOMParser();
      return domParser.parseFromString(t, "text/html");
    })
    .then((d) => 
    {
      loadedPages++;
      d.querySelectorAll('#content-wrapper #content article').forEach((e) => 
      {
        if (e.querySelectorAll('li.topic-info-comments a.new').length > 0) docFragment.appendChild(e);
      });
    });
  }

  var waiting = setInterval(() =>
  {
    if (loadedPages == lastPage)
    {
      clearInterval(waiting);
      if(DocumentFragment.childElementCount > 0)
      {
      	docFragment.childNodes.forEach((a) => {articleNode.appendChild(a);});
      	articleNode.removeChild(loadingNode);
      }
      else
      {
        loadingNode.innerHTML = '<img src="' + nopostspic + '" /> &mdash; Новых комментариев в твоих постах нет, почитай тогда уж посты других людей :)';
      }
    }
  }, 100);
})();
