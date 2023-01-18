// ==UserScript==
// @name         Непрочитанные посты на Табуне
// @version      0.1.1
// @description  Добавляет на страницу публикаций залогиненного пользователя вкладу для просмотра постов с новыми комментариями
// @author       makise_homura
// @match        https://tabun.everypony.ru/*
// @match        https://tabun.everypony.info/*
// @grant        none
// ==/UserScript==

const loadingpic = '/storage/06/08/97/2023/01/17/5f0aa790d5.gif';
const nopostspic = '/storage/06/08/97/2023/01/17/315b1451fa.gif';

(() =>
{
  const domain = window.location.href.includes('everypony.info') ? 'everypony.info' : 'everypony.ru';

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
  articleNode.appendChild(loadingNode);

  var docFragment = document.createDocumentFragment();
  var curPage = 0;
  var loadNextPage = true;

  var waiting = setInterval(() =>
  {
    if (loadNextPage)
    {
      if (curPage == lastPage)
      {
        clearInterval(waiting);
        if(docFragment.childElementCount > 0)
        {
          docFragment.childNodes.forEach((a) => {articleNode.appendChild(a);});
          articleNode.removeChild(loadingNode);
        }
        else
        {
          loadingNode.innerHTML = '<img src="//cdn.' + domain + nopostspic + '" /> &mdash; Новых комментариев в твоих постах нет, почитай тогда уж посты других людей :)';
        }
      }
      else
      {
        loadNextPage = false;
        curPage++;
        loadingNode.innerHTML = '<img src="//cdn.' + domain + loadingpic + '" /> &mdash; Загрузка страниц (' + curPage + '/' + lastPage + ')...';

        fetch('https://tabun.' + domain + '/profile/' + username + '/created/topics/page' + curPage)
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
          d.querySelectorAll('#content-wrapper #content article').forEach((e) =>
          {
            if (e.querySelectorAll('li.topic-info-comments a.new').length > 0) docFragment.appendChild(e);
          });
          loadNextPage = true;
        });
      }
    }
  }, 100);
})();
