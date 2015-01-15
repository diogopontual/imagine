# imagine

**Imagine** is a library to resize, crop and upload images on web applications. The list below enumerates some situations where the list is applicable:

* User avatar edition;
* Crop image to submit on web applications;
* etc.

## Configuration

To create an Imagine instance one should user the constructor method. The available signatures are:
```
var img = new Imagine(object);
var img = new Imagine(string);
var img = new Imagine(string,object);
```
where:
* object: a javascript object containing the properties listed above;
* string: a string containing al configurations options;

### Properties
JS Property   | DOM Attribute | Default Value | Description
------------- | --------------|---------------|------------
width | width | 0 | The width of the canvas element
height | height| 0 | The height of the canvas element
placeholder | placeholder |  | The text that is printed on the canvas when it does not have image
windowWidth | data-window-width | width | The width of a rectangle smaller or equals to the canvas element, that will represent the crop area.
windowHeight | data-window-height | height | The height of a rectangle smaller or equals to the canvas element, that will represent the crop area.


