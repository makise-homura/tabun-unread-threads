// ==UserScript==
// @name         Непрочитанные посты на Табуне
// @version      0.1.10
// @description  Добавляет на страницу профиля залогиненного пользователя пункт для просмотра постов с новыми комментариями
// @author       makise_homura
// @match        https://tabun.everypony.ru/*
// @match        https://tabun.everypony.info/*
// @match        https://tabun.everypony.me/*
// @match        https://tabun.everypony.online/*
// @grant        none
// ==/UserScript==

const loadingpic = '/storage/06/08/97/2023/01/17/5f0aa790d5.gif';
const nopostspic = '/storage/06/08/97/2023/01/17/315b1451fa.gif';

(() =>
{
  const domain = window.location.href.includes('everypony.info') ? 'everypony.info' : 'everypony.ru';

  const navPillsNode = document.querySelector('ul.nav-profile');
  if (!navPillsNode) return;

  var username = "";
  document.querySelectorAll('.username').forEach((e) => {if (e.text != "Мои топики") username = e.text;})
  if (!username) return;
  if (!window.location.href.includes('/profile/' + username)) return;

  const navItemNode = document.createElement('li');
  const navAnchorNode = document.createElement('a');
  navAnchorNode.setAttribute('href', '/profile/' + username + '/created/topics/?unread-posts');
  navAnchorNode.innerHTML = 'Посты с новыми комментариями';
  navItemNode.appendChild(navAnchorNode);
  navPillsNode.insertBefore(navItemNode, navPillsNode.childNodes[4]);

  if (!window.location.href.includes('unread-posts')) return;
  navPillsNode.childNodes.forEach((e) => {if(e.classList) e.classList.remove("active");})
  navItemNode.classList.add("active");

  var lastPage = 1;
  const lastPageLink = document.querySelector('.pagination ul:last-of-type li:last-of-type a');
  if (lastPageLink != null)
  {
    const lastPageRef = lastPageLink.href.match('page[0-9]+');
    if (lastPageRef.length != 1) return;
    lastPage = ~~lastPageRef[0].replace('page','');
  }

  const paginationNode = document.querySelector('.pagination');
  if (paginationNode) paginationNode.hidden = true;

  const articleNode = document.querySelector('#content-wrapper #content');
  articleNode.querySelectorAll('article').forEach((e) => {e.parentNode.removeChild(e);});
  const loadingNode = document.createElement('div');
  articleNode.appendChild(loadingNode);

  var docFragment = document.createDocumentFragment();
  var curPage = 0;
  var unread = 0;
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
          articleNode.appendChild(docFragment);
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
        loadingNode.innerHTML = '<img src="//cdn.' + domain + loadingpic + '" /> &mdash; Загрузка страниц (' + curPage + '/' + lastPage + ')' + (unread > 0 ? ', непрочитанных тредов: ' + unread : '') + '...';

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
            if (e.querySelectorAll('div.topic-info-comments a.new').length > 0) {unread++; docFragment.appendChild(e);}
          });
          loadNextPage = true;
        });
      }
    }
  }, 100);
})();
